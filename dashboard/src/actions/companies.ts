"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { companySchema, type CompanyInput } from "@/lib/validators/crm";
import {
  setPrimaryContactSchema,
  type SetPrimaryContactInput,
} from "@/lib/validators/leads";

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

/**
 * Validates that every FK reference on a Company payload either is null
 * OR points at a row inside the actor's organization (and, for the
 * primary contact, inside the target Company itself). Returns the first
 * problem found, or null when everything is sound.
 *
 * Cross-org foot-gun protection — without this, a Manager in Org A could
 * smuggle an Org B industry/country/etc. into their own Company row.
 */
async function validateReferences(args: {
  organizationId: string;
  companyId?: string;
  industryId?: string | null;
  countryId?: string | null;
  companySizeId?: string | null;
  leadSourceId?: string | null;
  ownerId?: string | null;
  primaryContactId?: string | null;
}): Promise<string | null> {
  const orgId = args.organizationId;

  if (args.industryId) {
    const r = await prisma.industry.findFirst({
      where: { id: args.industryId, organizationId: orgId },
      select: { id: true },
    });
    if (!r) return "Industry not found in this workspace.";
  }
  if (args.companySizeId) {
    const r = await prisma.companySize.findFirst({
      where: { id: args.companySizeId, organizationId: orgId },
      select: { id: true },
    });
    if (!r) return "Company size not found in this workspace.";
  }
  if (args.leadSourceId) {
    const r = await prisma.leadSource.findFirst({
      where: { id: args.leadSourceId, organizationId: orgId },
      select: { id: true },
    });
    if (!r) return "Lead source not found in this workspace.";
  }
  if (args.countryId) {
    // Country is global; just confirm the id exists.
    const r = await prisma.country.findUnique({
      where: { id: args.countryId },
      select: { id: true },
    });
    if (!r) return "Country not found.";
  }
  if (args.ownerId) {
    const r = await prisma.member.findFirst({
      where: { id: args.ownerId, organizationId: orgId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!r) return "Owner must be an active member of this workspace.";
  }
  if (args.primaryContactId) {
    // Primary contact must belong to this org AND to this Company (when
    // editing an existing Company). On create we accept any in-org contact;
    // the FK is fixed at create-time.
    const where: Prisma.ContactWhereInput = {
      id: args.primaryContactId,
      organizationId: orgId,
    };
    if (args.companyId) where.companyId = args.companyId;
    const r = await prisma.contact.findFirst({ where, select: { id: true } });
    if (!r) {
      return args.companyId
        ? "Primary contact must be a contact attached to this company."
        : "Primary contact not found in this workspace.";
    }
  }

  return null;
}

export async function upsertCompanyAction(input: CompanyInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("companies.manage"))) return { ok: false, error: "No permission." };
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  const tagErr = await validateTagIds(orgId, parsed.data.tagIds);
  if (tagErr) return { ok: false, error: tagErr };

  const refErr = await validateReferences({
    organizationId: orgId,
    companyId: parsed.data.id,
    industryId: parsed.data.industryId ?? null,
    countryId: parsed.data.countryId ?? null,
    companySizeId: parsed.data.companySizeId ?? null,
    leadSourceId: parsed.data.leadSourceId ?? null,
    ownerId: parsed.data.ownerId ?? null,
    // primaryContactId only makes sense when editing an existing company
    // (the contact would already be attached). Skip on create — set it
    // via a follow-up edit after creating the first contact.
    primaryContactId: parsed.data.id ? parsed.data.primaryContactId ?? null : null,
  });
  if (refErr) return { ok: false, error: refErr };

  const baseData = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    website: parsed.data.website ?? null,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    industryId: parsed.data.industryId ?? null,
    countryId: parsed.data.countryId ?? null,
    companySizeId: parsed.data.companySizeId ?? null,
    leadSourceId: parsed.data.leadSourceId ?? null,
    ownerId: parsed.data.ownerId ?? null,
    city: parsed.data.city ?? null,
    address: parsed.data.address ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
  };

  try {
    let result;
    if (parsed.data.id) {
      const existing = await prisma.company.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Company not found." };

      result = await prisma.$transaction(async (tx) => {
        const updated = await tx.company.update({
          where: { id: existing.id },
          data: { ...baseData, primaryContactId: parsed.data.primaryContactId ?? null },
        });
        await tx.companyTag.deleteMany({ where: { companyId: existing.id } });
        if (parsed.data.tagIds.length > 0) {
          await tx.companyTag.createMany({
            data: parsed.data.tagIds.map((tagId) => ({ companyId: existing.id, tagId })),
            skipDuplicates: true,
          });
        }
        return updated;
      });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "company.updated",
        resource: "company",
        resourceId: result.id,
      });
    } else {
      result = await prisma.$transaction(async (tx) => {
        const created = await tx.company.create({
          data: {
            ...baseData,
            organizationId: orgId,
            createdById: session.user.id,
          },
        });
        if (parsed.data.tagIds.length > 0) {
          await tx.companyTag.createMany({
            data: parsed.data.tagIds.map((tagId) => ({ companyId: created.id, tagId })),
            skipDuplicates: true,
          });
        }
        return created;
      });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "company.created",
        resource: "company",
        resourceId: result.id,
        metadata: { name: result.name, slug: result.slug },
      });
    }

    revalidatePath("/dashboard/companies");
    revalidatePath(`/dashboard/companies/${result.id}`);
    return { ok: true, id: result.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A company with that slug already exists." };
    }
    console.error("[companies] upsert failed", err);
    return { ok: false, error: "Could not save company." };
  }
}

export async function archiveCompanyAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("companies.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;

  const existing = await prisma.company.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) return { ok: false, error: "Company not found." };

  await prisma.company.update({
    where: { id },
    data: existing.archivedAt
      ? { archivedAt: null, status: "ACTIVE" }
      : { archivedAt: new Date(), status: "ARCHIVED" },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "company.restored" : "company.archived",
    resource: "company",
    resourceId: id,
  });
  revalidatePath("/dashboard/companies");
  revalidatePath(`/dashboard/companies/${id}`);
  return { ok: true };
}

/**
 * Designate a company's primary contact. Used from the Lead detail Company
 * tab so reps can flip the "main POC" without opening the full company
 * editor. The contact must already belong to the company; pass `null` to
 * clear the designation.
 */
export async function setPrimaryContactAction(
  input: SetPrimaryContactInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("companies.manage"))) return { ok: false, error: "No permission." };
  const parsed = setPrimaryContactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  const company = await prisma.company.findFirst({
    where: { id: parsed.data.companyId, organizationId: orgId },
  });
  if (!company) return { ok: false, error: "Company not found." };

  if (parsed.data.contactId) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: parsed.data.contactId,
        organizationId: orgId,
        companyId: company.id,
      },
      select: { id: true },
    });
    if (!contact) {
      return { ok: false, error: "Contact must be attached to this company." };
    }
  }

  await prisma.company.update({
    where: { id: company.id },
    data: { primaryContactId: parsed.data.contactId },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "company.updated",
    resource: "company",
    resourceId: company.id,
    metadata: { primaryContactId: parsed.data.contactId },
  });
  revalidatePath(`/dashboard/companies/${company.id}`);
  revalidatePath("/dashboard/leads");
  return { ok: true, id: company.id };
}
