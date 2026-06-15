"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { companySizeSchema, type CompanySizeInput } from "@/lib/validators/reference-data";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function upsertCompanySizeAction(input: CompanySizeInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("company-sizes.manage"))) return { ok: false, error: "No permission." };
  const parsed = companySizeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;
  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    sortOrder: parsed.data.sortOrder ?? 0,
    isActive: parsed.data.isActive ?? true,
  };

  try {
    if (parsed.data.id) {
      const existing = await prisma.companySize.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Company size not found." };
      const updated = await prisma.companySize.update({ where: { id: existing.id }, data });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "company-size.updated",
        resource: "company-size",
        resourceId: updated.id,
        metadata: { name: updated.name, slug: updated.slug },
      });
      revalidatePath("/dashboard/settings/company-sizes");
      return { ok: true, id: updated.id };
    }
    const created = await prisma.companySize.create({
      data: { ...data, organizationId: orgId, createdById: session.user.id },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "company-size.created",
      resource: "company-size",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/settings/company-sizes");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A company size with that slug already exists." };
    }
    console.error("[company-sizes] upsert failed", err);
    return { ok: false, error: "Could not save company size." };
  }
}

export async function archiveCompanySizeAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("company-sizes.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;
  const existing = await prisma.companySize.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return { ok: false, error: "Company size not found." };
  await prisma.companySize.update({
    where: { id },
    data: existing.archivedAt
      ? { archivedAt: null, isActive: true }
      : { archivedAt: new Date(), isActive: false },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "company-size.restored" : "company-size.archived",
    resource: "company-size",
    resourceId: id,
  });
  revalidatePath("/dashboard/settings/company-sizes");
  return { ok: true };
}
