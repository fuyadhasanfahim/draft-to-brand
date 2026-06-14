"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { companySchema, type CompanyInput } from "@/lib/validators/crm";

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

export async function upsertCompanyAction(input: CompanyInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("companies.manage"))) return { ok: false, error: "No permission." };
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  const tagErr = await validateTagIds(orgId, parsed.data.tagIds);
  if (tagErr) return { ok: false, error: tagErr };

  const baseData = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    website: parsed.data.website ?? null,
    industry: parsed.data.industry ?? null,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    size: parsed.data.size ?? null,
    country: parsed.data.country ?? null,
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
          data: baseData,
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
