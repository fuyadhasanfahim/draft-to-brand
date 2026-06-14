"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { departmentSchema, type DepartmentInput } from "@/lib/validators/org-graph";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function upsertDepartmentAction(input: DepartmentInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("departments.manage"))) return { ok: false, error: "No permission." };
  const parsed = departmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const data = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      branchId: parsed.data.branchId ?? null,
    };
    if (parsed.data.id) {
      const existing = await prisma.department.findUnique({ where: { id: parsed.data.id } });
      if (!existing || existing.organizationId !== session.member.organizationId) {
        return { ok: false, error: "Department not found." };
      }
      const updated = await prisma.department.update({ where: { id: existing.id }, data });
      await logAudit({
        organizationId: session.member.organizationId,
        actorUserId: session.user.id,
        action: "department.updated",
        resource: "department",
        resourceId: updated.id,
      });
      revalidatePath("/dashboard/departments");
      return { ok: true, id: updated.id };
    }

    const created = await prisma.department.create({
      data: { ...data, organizationId: session.member.organizationId },
    });
    await logAudit({
      organizationId: session.member.organizationId,
      actorUserId: session.user.id,
      action: "department.created",
      resource: "department",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/departments");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A department with that slug already exists." };
    }
    console.error("[departments] upsert failed", err);
    return { ok: false, error: "Could not save department." };
  }
}

export async function archiveDepartmentAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("departments.manage"))) return { ok: false, error: "No permission." };
  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Department not found." };
  }
  await prisma.department.update({
    where: { id },
    data: { archivedAt: existing.archivedAt ? null : new Date() },
  });
  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "department.restored" : "department.archived",
    resource: "department",
    resourceId: id,
  });
  revalidatePath("/dashboard/departments");
  return { ok: true };
}
