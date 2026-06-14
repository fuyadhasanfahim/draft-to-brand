"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { contactSchema, type ContactInput } from "@/lib/validators/crm";

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function validateTagIds(organizationId: string, tagIds: string[]) {
  if (tagIds.length === 0) return null;
  const found = await prisma.tag.findMany({
    where: { id: { in: tagIds }, organizationId },
    select: { id: true },
  });
  if (found.length !== tagIds.length) {
    return "One or more tags don't belong to this workspace.";
  }
  return null;
}

export async function upsertContactAction(input: ContactInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("contacts.manage"))) return { ok: false, error: "No permission." };
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  // Cross-org validation for the optional company link.
  if (parsed.data.companyId) {
    const c = await prisma.company.findFirst({
      where: { id: parsed.data.companyId, organizationId: orgId },
      select: { id: true },
    });
    if (!c) return { ok: false, error: "Company not found in this workspace." };
  }
  const tagErr = await validateTagIds(orgId, parsed.data.tagIds);
  if (tagErr) return { ok: false, error: tagErr };

  const baseData = {
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    jobTitle: parsed.data.jobTitle ?? null,
    linkedinUrl: parsed.data.linkedinUrl ?? null,
    notes: parsed.data.notes ?? null,
    status: parsed.data.status,
    companyId: parsed.data.companyId ?? null,
  };

  try {
    let result;
    if (parsed.data.id) {
      const existing = await prisma.contact.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Contact not found." };

      result = await prisma.$transaction(async (tx) => {
        const updated = await tx.contact.update({
          where: { id: existing.id },
          data: baseData,
        });
        await tx.contactTag.deleteMany({ where: { contactId: existing.id } });
        if (parsed.data.tagIds.length > 0) {
          await tx.contactTag.createMany({
            data: parsed.data.tagIds.map((tagId) => ({ contactId: existing.id, tagId })),
            skipDuplicates: true,
          });
        }
        return updated;
      });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "contact.updated",
        resource: "contact",
        resourceId: result.id,
      });
    } else {
      result = await prisma.$transaction(async (tx) => {
        const created = await tx.contact.create({
          data: {
            ...baseData,
            organizationId: orgId,
            createdById: session.user.id,
          },
        });
        if (parsed.data.tagIds.length > 0) {
          await tx.contactTag.createMany({
            data: parsed.data.tagIds.map((tagId) => ({ contactId: created.id, tagId })),
            skipDuplicates: true,
          });
        }
        return created;
      });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "contact.created",
        resource: "contact",
        resourceId: result.id,
        metadata: { firstName: result.firstName, lastName: result.lastName, email: result.email },
      });
    }

    revalidatePath("/dashboard/contacts");
    if (result.companyId) {
      revalidatePath(`/dashboard/companies/${result.companyId}`);
    }
    return { ok: true, id: result.id };
  } catch (err) {
    console.error("[contacts] upsert failed", err);
    return { ok: false, error: "Could not save contact." };
  }
}

export async function archiveContactAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("contacts.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;

  const existing = await prisma.contact.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) return { ok: false, error: "Contact not found." };

  await prisma.contact.update({
    where: { id },
    data: existing.archivedAt
      ? { archivedAt: null, status: "ACTIVE" }
      : { archivedAt: new Date(), status: "ARCHIVED" },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "contact.restored" : "contact.archived",
    resource: "contact",
    resourceId: id,
  });
  revalidatePath("/dashboard/contacts");
  if (existing.companyId) revalidatePath(`/dashboard/companies/${existing.companyId}`);
  return { ok: true };
}
