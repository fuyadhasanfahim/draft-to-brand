"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  cloneRoleSchema,
  createRoleSchema,
  updateRoleSchema,
  type CloneRoleInput,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "@/lib/validators/roles";

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function syncPermissions(
  tx: Prisma.TransactionClient,
  roleId: string,
  permissionKeys: string[]
) {
  const perms = await tx.permission.findMany({
    where: { key: { in: permissionKeys } },
  });
  await tx.rolePermission.deleteMany({ where: { roleId } });
  if (perms.length > 0) {
    await tx.rolePermission.createMany({
      data: perms.map((p) => ({ roleId, permissionId: p.id })),
      skipDuplicates: true,
    });
  }
}

export async function createRoleAction(input: CreateRoleInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("roles.manage"))) return { ok: false, error: "No permission." };
  const parsed = createRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const role = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          organizationId: session.member.organizationId,
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description ?? null,
          isSystem: false,
        },
      });
      await syncPermissions(tx, created.id, parsed.data.permissionKeys);
      return created;
    });
    await logAudit({
      organizationId: session.member.organizationId,
      actorUserId: session.user.id,
      action: "role.created",
      resource: "role",
      resourceId: role.id,
      metadata: { name: role.name, slug: role.slug },
    });
    revalidatePath("/dashboard/roles");
    return { ok: true, id: role.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A role with that slug already exists." };
    }
    console.error("[roles] create failed", err);
    return { ok: false, error: "Could not create role." };
  }
}

export async function updateRoleAction(input: UpdateRoleInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("roles.manage"))) return { ok: false, error: "No permission." };
  const parsed = updateRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const existing = await prisma.role.findUnique({ where: { id: parsed.data.id } });
  if (!existing || existing.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Role not found." };
  }

  // System roles: keep name/slug locked; let admins still tweak permissions
  // (Owner is special-cased — its permission set is always the full registry).
  const isOwner = existing.slug === "owner" && existing.isSystem;
  if (isOwner) {
    return { ok: false, error: "The Owner role cannot be edited." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id: existing.id },
        data: existing.isSystem
          ? { description: parsed.data.description ?? null }
          : {
              name: parsed.data.name,
              slug: parsed.data.slug,
              description: parsed.data.description ?? null,
            },
      });
      await syncPermissions(tx, existing.id, parsed.data.permissionKeys);
    });
    await logAudit({
      organizationId: session.member.organizationId,
      actorUserId: session.user.id,
      action: "role.updated",
      resource: "role",
      resourceId: existing.id,
    });
    revalidatePath("/dashboard/roles");
    return { ok: true, id: existing.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A role with that slug already exists." };
    }
    console.error("[roles] update failed", err);
    return { ok: false, error: "Could not update role." };
  }
}

export async function deleteRoleAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("roles.manage"))) return { ok: false, error: "No permission." };

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Role not found." };
  }
  if (existing.isSystem) {
    return { ok: false, error: "System roles cannot be deleted." };
  }
  const memberCount = await prisma.member.count({ where: { roleId: id } });
  if (memberCount > 0) {
    return {
      ok: false,
      error: `${memberCount} member${memberCount === 1 ? "" : "s"} still use this role. Reassign them first.`,
    };
  }

  await prisma.role.delete({ where: { id } });
  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "role.deleted",
    resource: "role",
    resourceId: id,
    metadata: { name: existing.name, slug: existing.slug },
  });
  revalidatePath("/dashboard/roles");
  return { ok: true };
}

export async function cloneRoleAction(input: CloneRoleInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("roles.manage"))) return { ok: false, error: "No permission." };
  const parsed = cloneRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const source = await prisma.role.findUnique({
    where: { id: parsed.data.sourceRoleId },
    include: { rolePermissions: { include: { permission: true } } },
  });
  if (!source || source.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Source role not found." };
  }

  try {
    const cloned = await prisma.$transaction(async (tx) => {
      const created = await tx.role.create({
        data: {
          organizationId: session.member.organizationId,
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: source.description ? `Cloned from ${source.name}` : null,
          isSystem: false,
          priority: source.priority,
        },
      });
      await tx.rolePermission.createMany({
        data: source.rolePermissions.map((rp) => ({
          roleId: created.id,
          permissionId: rp.permissionId,
        })),
        skipDuplicates: true,
      });
      return created;
    });
    await logAudit({
      organizationId: session.member.organizationId,
      actorUserId: session.user.id,
      action: "role.created",
      resource: "role",
      resourceId: cloned.id,
      metadata: { clonedFrom: source.id, name: cloned.name },
    });
    revalidatePath("/dashboard/roles");
    return { ok: true, id: cloned.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A role with that slug already exists." };
    }
    console.error("[roles] clone failed", err);
    return { ok: false, error: "Could not clone role." };
  }
}
