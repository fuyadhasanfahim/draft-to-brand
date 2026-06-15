"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { industrySchema, type IndustryInput } from "@/lib/validators/reference-data";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function upsertIndustryAction(input: IndustryInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("industries.manage"))) return { ok: false, error: "No permission." };
  const parsed = industrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;
  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    isActive: parsed.data.isActive ?? true,
  };

  try {
    if (parsed.data.id) {
      const existing = await prisma.industry.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Industry not found." };
      const updated = await prisma.industry.update({ where: { id: existing.id }, data });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "industry.updated",
        resource: "industry",
        resourceId: updated.id,
        metadata: { name: updated.name, slug: updated.slug },
      });
      revalidatePath("/dashboard/settings/industries");
      return { ok: true, id: updated.id };
    }
    const created = await prisma.industry.create({
      data: { ...data, organizationId: orgId, createdById: session.user.id },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "industry.created",
      resource: "industry",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/settings/industries");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "An industry with that slug already exists." };
    }
    console.error("[industries] upsert failed", err);
    return { ok: false, error: "Could not save industry." };
  }
}

export async function archiveIndustryAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("industries.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;
  const existing = await prisma.industry.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return { ok: false, error: "Industry not found." };
  await prisma.industry.update({
    where: { id },
    data: existing.archivedAt
      ? { archivedAt: null, isActive: true }
      : { archivedAt: new Date(), isActive: false },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "industry.restored" : "industry.archived",
    resource: "industry",
    resourceId: id,
  });
  revalidatePath("/dashboard/settings/industries");
  return { ok: true };
}
