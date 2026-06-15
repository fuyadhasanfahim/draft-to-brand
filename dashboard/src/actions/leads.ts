"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  leadSchema,
  newLeadFromScratchSchema,
  reassignLeadOwnerSchema,
  type LeadFormValues,
  type NewLeadFormValues,
  type ReassignLeadOwnerInput,
} from "@/lib/validators/leads";
import { slugify } from "@/lib/validators/onboarding";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/**
 * Map a stage's terminal `outcome` to the Lead.status it should carry.
 * Lead status is derived — there is no manual status dropdown.
 */
function deriveStatus(outcome: "OPEN" | "WON" | "LOST"): "OPEN" | "WON" | "LOST" {
  return outcome;
}

async function validateLeadReferences(args: {
  organizationId: string;
  pipelineId: string;
  stageId: string;
  companyId?: string | null;
  contactId?: string | null;
  leadSourceId?: string | null;
  ownerId?: string | null;
}): Promise<{ ok: true; stageOutcome: "OPEN" | "WON" | "LOST" } | { ok: false; error: string }> {
  const orgId = args.organizationId;

  const pipeline = await prisma.pipeline.findFirst({
    where: { id: args.pipelineId, organizationId: orgId },
    select: { id: true },
  });
  if (!pipeline) return { ok: false, error: "Pipeline not found in this workspace." };

  const stage = await prisma.pipelineStage.findFirst({
    where: { id: args.stageId, pipelineId: args.pipelineId },
    select: { id: true, outcome: true },
  });
  if (!stage) return { ok: false, error: "Stage doesn't belong to the selected pipeline." };

  if (args.companyId) {
    const r = await prisma.company.findFirst({
      where: { id: args.companyId, organizationId: orgId },
      select: { id: true },
    });
    if (!r) return { ok: false, error: "Company not found in this workspace." };
  }
  if (args.contactId) {
    const r = await prisma.contact.findFirst({
      where: { id: args.contactId, organizationId: orgId },
      select: { id: true, companyId: true },
    });
    if (!r) return { ok: false, error: "Contact not found in this workspace." };
    if (args.companyId && r.companyId && r.companyId !== args.companyId) {
      return { ok: false, error: "Contact is attached to a different company." };
    }
  }
  if (args.leadSourceId) {
    const r = await prisma.leadSource.findFirst({
      where: { id: args.leadSourceId, organizationId: orgId },
      select: { id: true },
    });
    if (!r) return { ok: false, error: "Lead source not found in this workspace." };
  }
  if (args.ownerId) {
    const r = await prisma.member.findFirst({
      where: { id: args.ownerId, organizationId: orgId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!r) return { ok: false, error: "Owner must be an active member of this workspace." };
  }

  return { ok: true, stageOutcome: stage.outcome };
}

export async function upsertLeadAction(input: LeadFormValues): Promise<Result> {
  const session = await requireVerifiedSession();
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;
  const isEdit = Boolean(parsed.data.id);

  if (isEdit) {
    if (!(await can("leads.edit")) && !(await can("leads.manage"))) {
      return { ok: false, error: "No permission." };
    }
  } else {
    if (!(await can("leads.create")) && !(await can("leads.manage"))) {
      return { ok: false, error: "No permission." };
    }
  }

  const refs = await validateLeadReferences({
    organizationId: orgId,
    pipelineId: parsed.data.pipelineId,
    stageId: parsed.data.stageId,
    companyId: parsed.data.companyId ?? null,
    contactId: parsed.data.contactId ?? null,
    leadSourceId: parsed.data.leadSourceId ?? null,
  });
  if (!refs.ok) return refs;

  const status = deriveStatus(refs.stageOutcome);

  const baseData = {
    title: parsed.data.title,
    companyId: parsed.data.companyId ?? null,
    contactId: parsed.data.contactId ?? null,
    leadSourceId: parsed.data.leadSourceId ?? null,
    pipelineId: parsed.data.pipelineId,
    stageId: parsed.data.stageId,
    status,
    priority: parsed.data.priority,
    estimatedValue: parsed.data.estimatedValue ?? null,
    currency: parsed.data.currency ?? null,
    expectedCloseDate: parsed.data.expectedCloseDate ?? null,
    description: parsed.data.description ?? null,
  };

  try {
    if (parsed.data.id) {
      const existing = await prisma.lead.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Lead not found." };

      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.lead.update({ where: { id: existing.id }, data: baseData });

        const events: { type: string; message: string; metadata: Prisma.InputJsonValue }[] = [];
        if (existing.stageId !== u.stageId) {
          events.push({
            type: "stage.changed",
            message: "Stage moved",
            metadata: { fromStageId: existing.stageId, toStageId: u.stageId },
          });
        }
        if (existing.status !== u.status) {
          events.push({
            type: "lead.updated",
            message: `Status changed to ${u.status}`,
            metadata: { fromStatus: existing.status, toStatus: u.status },
          });
        }
        if (events.length === 0) {
          events.push({ type: "lead.updated", message: "Lead updated", metadata: {} });
        }
        await tx.leadActivity.createMany({
          data: events.map((e) => ({
            organizationId: orgId,
            leadId: u.id,
            type: e.type,
            message: e.message,
            metadata: e.metadata,
            createdById: session.user.id,
          })),
        });
        return u;
      });

      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "lead.updated",
        resource: "lead",
        resourceId: updated.id,
        metadata: { title: updated.title },
      });
      revalidatePath("/dashboard/leads");
      revalidatePath(`/dashboard/leads/${updated.id}`);
      return { ok: true, id: updated.id };
    }

    const created = await prisma.$transaction(async (tx) => {
      const c = await tx.lead.create({
        data: {
          ...baseData,
          // Owner defaults to the current member — never collected on create.
          ownerId: session.member.id,
          organizationId: orgId,
          createdById: session.user.id,
        },
      });
      await tx.leadActivity.create({
        data: {
          organizationId: orgId,
          leadId: c.id,
          type: "lead.created",
          message: "Lead created",
          metadata: { title: c.title } as Prisma.InputJsonValue,
          createdById: session.user.id,
        },
      });
      return c;
    });

    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "lead.created",
      resource: "lead",
      resourceId: created.id,
      metadata: { title: created.title },
    });
    revalidatePath("/dashboard/leads");
    return { ok: true, id: created.id };
  } catch (err) {
    console.error("[leads] upsert failed", err);
    return { ok: false, error: "Could not save lead." };
  }
}

export async function archiveLeadAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("leads.delete")) && !(await can("leads.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const orgId = session.member.organizationId;
  const existing = await prisma.lead.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return { ok: false, error: "Lead not found." };

  const archiving = !existing.archivedAt;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id },
      data: { archivedAt: archiving ? new Date() : null },
    });
    await tx.leadActivity.create({
      data: {
        organizationId: orgId,
        leadId: id,
        type: archiving ? "lead.archived" : "lead.restored",
        message: archiving ? "Lead archived" : "Lead restored",
        createdById: session.user.id,
      },
    });
  });

  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: archiving ? "lead.archived" : "lead.restored",
    resource: "lead",
    resourceId: id,
  });
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${id}`);
  return { ok: true };
}

/**
 * One-shot "create everything" path used by /dashboard/leads/new.
 *
 * Creates: Company → Primary Contact → Additional Contacts → Lead, sets
 * Company.primaryContactId, links Lead.contactId to the primary contact,
 * and writes a `lead.created` activity row. Single Prisma transaction —
 * any failure rolls the whole thing back; we never leave a half-built
 * Company without a Lead, or a Lead pointing at a missing Contact.
 */
async function uniqueCompanySlug(
  organizationId: string,
  name: string,
  tx: Prisma.TransactionClient
): Promise<string> {
  const base = slugify(name) || "company";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const conflict = await tx.company.findFirst({
      where: { organizationId, slug: candidate },
      select: { id: true },
    });
    if (!conflict) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function createLeadFromScratchAction(
  input: NewLeadFormValues
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("leads.create")) && !(await can("leads.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = newLeadFromScratchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const refs = await validateLeadReferences({
    organizationId: orgId,
    pipelineId: parsed.data.pipelineId,
    stageId: parsed.data.stageId,
  });
  if (!refs.ok) return refs;
  const status = deriveStatus(refs.stageOutcome);

  // ── Existing-Company branch ────────────────────────────────────────────
  // When the user picked an existing company from search, validate it
  // belongs to this workspace and short-circuit all company-creation FKs.
  let existingCompany:
    | { id: string; leadSourceId: string | null }
    | null = null;
  if (parsed.data.companyId) {
    const c = await prisma.company.findFirst({
      where: { id: parsed.data.companyId, organizationId: orgId },
      select: { id: true, leadSourceId: true },
    });
    if (!c) return { ok: false, error: "Company not found in this workspace." };
    existingCompany = c;
  } else {
    // New-Company branch — reference-data FK checks.
    if (parsed.data.company.industryId) {
      const r = await prisma.industry.findFirst({
        where: { id: parsed.data.company.industryId, organizationId: orgId },
        select: { id: true },
      });
      if (!r) return { ok: false, error: "Industry not found in this workspace." };
    }
    if (parsed.data.company.companySizeId) {
      const r = await prisma.companySize.findFirst({
        where: { id: parsed.data.company.companySizeId, organizationId: orgId },
        select: { id: true },
      });
      if (!r) return { ok: false, error: "Company size not found in this workspace." };
    }
    if (parsed.data.company.countryId) {
      const r = await prisma.country.findUnique({
        where: { id: parsed.data.company.countryId },
        select: { id: true },
      });
      if (!r) return { ok: false, error: "Country not found." };
    }
    if (parsed.data.company.leadSourceId) {
      const r = await prisma.leadSource.findFirst({
        where: { id: parsed.data.company.leadSourceId, organizationId: orgId },
        select: { id: true },
      });
      if (!r) return { ok: false, error: "Lead source not found in this workspace." };
    }
  }

  // ── Existing-Primary-Contact branch ────────────────────────────────────
  // Must belong to the same company we're about to attach the Lead to.
  // When the company is new, an existingPrimaryContactId can't apply.
  if (parsed.data.existingPrimaryContactId) {
    if (!existingCompany) {
      return {
        ok: false,
        error: "Existing contact can only be reused on an existing company.",
      };
    }
    const c = await prisma.contact.findFirst({
      where: {
        id: parsed.data.existingPrimaryContactId,
        organizationId: orgId,
        companyId: existingCompany.id,
      },
      select: { id: true },
    });
    if (!c) {
      return { ok: false, error: "Contact must be attached to the selected company." };
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Company — reuse or create.
      let companyId: string;
      let companyLeadSourceId: string | null;
      if (existingCompany) {
        companyId = existingCompany.id;
        companyLeadSourceId = existingCompany.leadSourceId;
      } else {
        const name = (parsed.data.company.name ?? "").trim();
        const slug = await uniqueCompanySlug(orgId, name, tx);
        const created = await tx.company.create({
          data: {
            organizationId: orgId,
            name,
            slug,
            website: parsed.data.company.website ?? null,
            industryId: parsed.data.company.industryId ?? null,
            countryId: parsed.data.company.countryId ?? null,
            companySizeId: parsed.data.company.companySizeId ?? null,
            leadSourceId: parsed.data.company.leadSourceId ?? null,
            ownerId: session.member.id,
            createdById: session.user.id,
          },
        });
        companyId = created.id;
        companyLeadSourceId = created.leadSourceId;
      }

      // 2. Primary contact — reuse or create.
      let primaryContactId: string;
      if (parsed.data.existingPrimaryContactId) {
        primaryContactId = parsed.data.existingPrimaryContactId;
      } else {
        const pc = parsed.data.primaryContact;
        const primary = await tx.contact.create({
          data: {
            organizationId: orgId,
            companyId,
            firstName: pc.firstName!.trim(),
            lastName: pc.lastName!.trim(),
            email: pc.email!.trim(),
            phone: pc.phone ?? null,
            jobTitle: pc.jobTitle ?? null,
            linkedinUrl: pc.linkedinUrl ?? null,
            createdById: session.user.id,
          },
        });
        primaryContactId = primary.id;
      }

      // 3. Additional contacts.
      for (const c of parsed.data.additionalContacts) {
        await tx.contact.create({
          data: {
            organizationId: orgId,
            companyId,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email ?? null,
            phone: c.phone ?? null,
            jobTitle: c.jobTitle ?? null,
            linkedinUrl: c.linkedinUrl ?? null,
            createdById: session.user.id,
          },
        });
      }

      // 4. Mark primary contact on the company. If we're reusing an existing
      //    company that already has a primary, we DON'T overwrite it — the
      //    primary contact selector on the Lead detail handles changes.
      if (!existingCompany) {
        await tx.company.update({
          where: { id: companyId },
          data: { primaryContactId },
        });
      }

      // 5. Lead. Inherits the company's lead source if the form didn't
      //    override (only happens on the new-company branch since the
      //    existing-company branch never collects company.leadSourceId).
      const lead = await tx.lead.create({
        data: {
          organizationId: orgId,
          title: parsed.data.title,
          companyId,
          contactId: primaryContactId,
          leadSourceId: companyLeadSourceId,
          ownerId: session.member.id,
          pipelineId: parsed.data.pipelineId,
          stageId: parsed.data.stageId,
          status,
          priority: parsed.data.priority,
          estimatedValue: parsed.data.estimatedValue ?? null,
          currency: parsed.data.currency ?? null,
          expectedCloseDate: parsed.data.expectedCloseDate ?? null,
          description: parsed.data.description ?? null,
          createdById: session.user.id,
        },
      });

      await tx.leadActivity.create({
        data: {
          organizationId: orgId,
          leadId: lead.id,
          type: "lead.created",
          message: "Lead created",
          metadata: {
            title: lead.title,
            companyId,
            primaryContactId,
            reusedCompany: Boolean(existingCompany),
            reusedPrimaryContact: Boolean(parsed.data.existingPrimaryContactId),
          } as Prisma.InputJsonValue,
          createdById: session.user.id,
        },
      });

      return { lead, company: { id: companyId } };
    });

    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "lead.created",
      resource: "lead",
      resourceId: result.lead.id,
      metadata: { title: result.lead.title, companyId: result.company.id },
    });
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/companies");
    revalidatePath("/dashboard/contacts");
    return { ok: true, id: result.lead.id };
  } catch (err) {
    console.error("[leads] create-from-scratch failed", err);
    return { ok: false, error: "Could not create lead." };
  }
}

/**
 * Reassign Lead.ownerId. Surfaced from Lead detail (we removed Owner from
 * create). Logs `owner.changed` activity and an audit row.
 */
export async function reassignLeadOwnerAction(
  input: ReassignLeadOwnerInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("leads.edit")) && !(await can("leads.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = reassignLeadOwnerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  const lead = await prisma.lead.findFirst({
    where: { id: parsed.data.leadId, organizationId: orgId },
  });
  if (!lead) return { ok: false, error: "Lead not found." };

  if (parsed.data.ownerId) {
    const member = await prisma.member.findFirst({
      where: { id: parsed.data.ownerId, organizationId: orgId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!member) return { ok: false, error: "Owner must be an active member of this workspace." };
  }

  if (lead.ownerId === parsed.data.ownerId) return { ok: true, id: lead.id };

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: lead.id },
      data: { ownerId: parsed.data.ownerId },
    });
    await tx.leadActivity.create({
      data: {
        organizationId: orgId,
        leadId: lead.id,
        type: "owner.changed",
        message: parsed.data.ownerId ? "Owner assigned" : "Owner cleared",
        metadata: {
          fromOwnerId: lead.ownerId,
          toOwnerId: parsed.data.ownerId,
        } as Prisma.InputJsonValue,
        createdById: session.user.id,
      },
    });
  });

  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "lead.updated",
    resource: "lead",
    resourceId: lead.id,
    metadata: { ownerChanged: true },
  });
  revalidatePath(`/dashboard/leads/${lead.id}`);
  revalidatePath("/dashboard/leads");
  return { ok: true, id: lead.id };
}
