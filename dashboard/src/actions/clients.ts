"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  clientSchema,
  convertLeadToClientSchema,
  type ClientFormValues,
  type ConvertLeadToClientInput,
} from "@/lib/validators/clients";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/**
 * Cross-org validation for the FKs on a Client payload. Company must belong
 * to the workspace; owner must be an active Member of the workspace.
 */
async function validateClientReferences(args: {
  organizationId: string;
  companyId: string;
  ownerId?: string | null;
}): Promise<string | null> {
  const company = await prisma.company.findFirst({
    where: { id: args.companyId, organizationId: args.organizationId },
    select: { id: true },
  });
  if (!company) return "Company not found in this workspace.";

  if (args.ownerId) {
    const r = await prisma.member.findFirst({
      where: {
        id: args.ownerId,
        organizationId: args.organizationId,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (!r) return "Owner must be an active member of this workspace.";
  }
  return null;
}

export async function upsertClientAction(input: ClientFormValues): Promise<Result> {
  const session = await requireVerifiedSession();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;
  const isEdit = Boolean(parsed.data.id);

  if (isEdit) {
    if (!(await can("clients.edit")) && !(await can("clients.manage"))) {
      return { ok: false, error: "No permission." };
    }
  } else {
    if (!(await can("clients.create")) && !(await can("clients.manage"))) {
      return { ok: false, error: "No permission." };
    }
  }

  const refErr = await validateClientReferences({
    organizationId: orgId,
    companyId: parsed.data.companyId,
    ownerId: parsed.data.ownerId ?? null,
  });
  if (refErr) return { ok: false, error: refErr };

  const baseData = {
    companyId: parsed.data.companyId,
    ownerId: parsed.data.ownerId ?? null,
    status: parsed.data.status,
    onboardingStatus: parsed.data.onboardingStatus,
    startDate: parsed.data.startDate ?? null,
    notes: parsed.data.notes ?? null,
  };

  try {
    if (parsed.data.id) {
      const existing = await prisma.client.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Client not found." };

      // Changing the Company is allowed only if no other Client points at
      // the target — companyId is @unique.
      if (existing.companyId !== parsed.data.companyId) {
        const taken = await prisma.client.findFirst({
          where: { companyId: parsed.data.companyId, NOT: { id: existing.id } },
          select: { id: true },
        });
        if (taken) {
          return {
            ok: false,
            error: "Another Client already exists for that Company.",
          };
        }
      }

      const updated = await prisma.client.update({
        where: { id: existing.id },
        data: baseData,
      });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "client.updated",
        resource: "client",
        resourceId: updated.id,
        metadata: { companyId: updated.companyId, status: updated.status },
      });
      revalidatePath("/dashboard/clients");
      revalidatePath(`/dashboard/clients/${updated.id}`);
      return { ok: true, id: updated.id };
    }

    // Create — block duplicate Client for the same Company.
    const existingForCompany = await prisma.client.findUnique({
      where: { companyId: parsed.data.companyId },
      select: { id: true },
    });
    if (existingForCompany) {
      return {
        ok: false,
        error: "A Client already exists for that Company.",
      };
    }

    const created = await prisma.client.create({
      data: { ...baseData, organizationId: orgId },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "client.created",
      resource: "client",
      resourceId: created.id,
      metadata: {
        companyId: created.companyId,
        origin: "manual",
      },
    });
    revalidatePath("/dashboard/clients");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A Client already exists for that Company." };
    }
    console.error("[clients] upsert failed", err);
    return { ok: false, error: "Could not save client." };
  }
}

export async function archiveClientAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("clients.delete")) && !(await can("clients.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const orgId = session.member.organizationId;
  const existing = await prisma.client.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return { ok: false, error: "Client not found." };

  const archiving = !existing.archivedAt;
  await prisma.client.update({
    where: { id },
    data: { archivedAt: archiving ? new Date() : null },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: archiving ? "client.archived" : "client.restored",
    resource: "client",
    resourceId: id,
  });
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { ok: true };
}

/**
 * Convert a WON Lead into a Client. Single transaction:
 *  1. Verify Lead exists, belongs to org, status = WON, has a company, not
 *     already converted.
 *  2. Verify no Client exists for the lead's company yet.
 *  3. Create Client linking back to Company + Lead, inheriting the Lead's owner.
 *  4. Write `lead.converted` activity on the Lead.
 *  5. Audit both `client.created` and `lead.converted`.
 */
export async function convertLeadToClientAction(
  input: ConvertLeadToClientInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("clients.create")) && !(await can("clients.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = convertLeadToClientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  const lead = await prisma.lead.findFirst({
    where: { id: parsed.data.leadId, organizationId: orgId },
    include: { client: { select: { id: true } } },
  });
  if (!lead) return { ok: false, error: "Lead not found." };
  if (lead.status !== "WON") {
    return { ok: false, error: "Only WON leads can be converted to a Client." };
  }
  if (!lead.companyId) {
    return {
      ok: false,
      error: "Attach a company to this Lead before converting.",
    };
  }
  if (lead.client) {
    return { ok: false, error: "This Lead has already been converted." };
  }

  // Conflict check: the Lead's company might already have a Client (created
  // manually or from a different Lead earlier). 1:1 with Company holds.
  const companyAlreadyClient = await prisma.client.findUnique({
    where: { companyId: lead.companyId },
    select: { id: true },
  });
  if (companyAlreadyClient) {
    return {
      ok: false,
      error: "A Client already exists for this Lead's company.",
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          organizationId: orgId,
          companyId: lead.companyId!,
          leadId: lead.id,
          ownerId: lead.ownerId,
          status: "ACTIVE",
          onboardingStatus: "NOT_STARTED",
        },
      });
      await tx.leadActivity.create({
        data: {
          organizationId: orgId,
          leadId: lead.id,
          type: "lead.converted",
          message: "Lead converted to client",
          metadata: { clientId: client.id } as Prisma.InputJsonValue,
          createdById: session.user.id,
        },
      });
      return client;
    });

    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "client.created",
      resource: "client",
      resourceId: result.id,
      metadata: {
        companyId: result.companyId,
        leadId: lead.id,
        origin: "lead_conversion",
      },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "lead.converted",
      resource: "lead",
      resourceId: lead.id,
      metadata: { clientId: result.id },
    });

    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/leads");
    revalidatePath(`/dashboard/leads/${lead.id}`);
    return { ok: true, id: result.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "This Lead has already been converted." };
    }
    console.error("[clients] convert failed", err);
    return { ok: false, error: "Could not convert lead." };
  }
}
