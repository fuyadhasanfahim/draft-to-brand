"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { leadSourceSchema, type LeadSourceInput } from "@/lib/validators/reference-data";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function upsertLeadSourceAction(input: LeadSourceInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("lead-sources.manage"))) return { ok: false, error: "No permission." };
  const parsed = leadSourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;
  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    color: parsed.data.color ?? "#6b6e6e",
    isActive: parsed.data.isActive ?? true,
  };

  try {
    if (parsed.data.id) {
      const existing = await prisma.leadSource.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Lead source not found." };
      const updated = await prisma.leadSource.update({ where: { id: existing.id }, data });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "lead-source.updated",
        resource: "lead-source",
        resourceId: updated.id,
        metadata: { name: updated.name, slug: updated.slug },
      });
      revalidatePath("/dashboard/settings/lead-sources");
      return { ok: true, id: updated.id };
    }
    const created = await prisma.leadSource.create({
      data: { ...data, organizationId: orgId, createdById: session.user.id },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "lead-source.created",
      resource: "lead-source",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/settings/lead-sources");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A lead source with that slug already exists." };
    }
    console.error("[lead-sources] upsert failed", err);
    return { ok: false, error: "Could not save lead source." };
  }
}

export async function archiveLeadSourceAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("lead-sources.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;
  const existing = await prisma.leadSource.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return { ok: false, error: "Lead source not found." };
  await prisma.leadSource.update({
    where: { id },
    data: existing.archivedAt
      ? { archivedAt: null, isActive: true }
      : { archivedAt: new Date(), isActive: false },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "lead-source.restored" : "lead-source.archived",
    resource: "lead-source",
    resourceId: id,
  });
  revalidatePath("/dashboard/settings/lead-sources");
  return { ok: true };
}
