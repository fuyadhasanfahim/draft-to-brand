"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { branchSchema, type BranchInput } from "@/lib/validators/org-graph";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function upsertBranchAction(input: BranchInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("branches.manage"))) return { ok: false, error: "No permission." };
  const parsed = branchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const data = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      country: parsed.data.country ?? null,
      isHeadquarter: parsed.data.isHeadquarter ?? false,
    };

    if (parsed.data.id) {
      const existing = await prisma.branch.findUnique({ where: { id: parsed.data.id } });
      if (!existing || existing.organizationId !== session.member.organizationId) {
        return { ok: false, error: "Branch not found." };
      }
      const updated = await prisma.branch.update({ where: { id: existing.id }, data });
      await logAudit({
        organizationId: session.member.organizationId,
        actorUserId: session.user.id,
        action: "branch.updated",
        resource: "branch",
        resourceId: updated.id,
      });
      revalidatePath("/dashboard/branches");
      return { ok: true, id: updated.id };
    }

    const created = await prisma.branch.create({
      data: { ...data, organizationId: session.member.organizationId },
    });
    await logAudit({
      organizationId: session.member.organizationId,
      actorUserId: session.user.id,
      action: "branch.created",
      resource: "branch",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/branches");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A branch with that slug already exists." };
    }
    console.error("[branches] upsert failed", err);
    return { ok: false, error: "Could not save branch." };
  }
}

export async function archiveBranchAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("branches.manage"))) return { ok: false, error: "No permission." };
  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Branch not found." };
  }
  await prisma.branch.update({
    where: { id },
    data: { archivedAt: existing.archivedAt ? null : new Date() },
  });
  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "branch.restored" : "branch.archived",
    resource: "branch",
    resourceId: id,
  });
  revalidatePath("/dashboard/branches");
  return { ok: true };
}
