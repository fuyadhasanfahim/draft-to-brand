import "server-only";
import { prisma } from "@/lib/db";
import { resolveEffectivePermissions } from "./resolve";
import type { PermissionKey } from "./registry";

/**
 * Authorization policy for actions that change OTHER users' authority.
 *
 *   `canAssignRole(actor, target)` — May `actor` assign `target` to a user?
 *     - The Owner slug is reserved for Owners only.
 *     - Otherwise, the role's full permission set must be a subset of the
 *       actor's effective permissions. Without this rule, anyone with
 *       `members.edit` could simply pick "Owner" from the dropdown.
 *
 *   `canGrantPermissions(actor, keys)` — May `actor` create/update a role
 *     that grants `keys`? Same subset rule — you can't manufacture a
 *     higher-privileged role than the one you already hold.
 *
 *   `canManageMember(actor, target)` — Can `actor` mutate `target`?
 *     - You can't outrank-edit an Owner unless you are one yourself.
 *
 * All checks load the actor's effective permission set from the DB
 * (cached per request via React `cache`) — no client-asserted state is
 * trusted.
 */

type ActorContext = {
  userId: string;
  organizationId: string;
  isOwner: boolean;
  effective: Set<PermissionKey>;
};

export async function loadActorContext(
  userId: string,
  organizationId: string
): Promise<ActorContext> {
  const [member, effective] = await Promise.all([
    prisma.member.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      include: { role: { select: { slug: true } } },
    }),
    resolveEffectivePermissions(userId, organizationId),
  ]);
  return {
    userId,
    organizationId,
    isOwner: member?.role.slug === "owner",
    effective,
  };
}

/**
 * Loads a role + its granted permission keys for membership in `organizationId`.
 * Returns null if the role doesn't exist or belongs to a different org.
 */
async function loadRoleWithKeys(roleId: string, organizationId: string) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, organizationId },
    include: { rolePermissions: { include: { permission: true } } },
  });
  if (!role) return null;
  return {
    id: role.id,
    slug: role.slug,
    isSystem: role.isSystem,
    permissionKeys: role.rolePermissions.map((rp) => rp.permission.key as PermissionKey),
  };
}

export async function canAssignRole(
  actor: ActorContext,
  roleId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const role = await loadRoleWithKeys(roleId, actor.organizationId);
  if (!role) return { ok: false, error: "Role not found in this workspace." };

  // The Owner role is reserved for Owners.
  if (role.slug === "owner" && !actor.isOwner) {
    return { ok: false, error: "Only an Owner can grant the Owner role." };
  }

  // Owner can assign anything.
  if (actor.isOwner) return { ok: true };

  // Otherwise: the role's permission set must be a subset of the actor's.
  const escalating = role.permissionKeys.filter((k) => !actor.effective.has(k));
  if (escalating.length > 0) {
    return {
      ok: false,
      error: `You can't assign this role — it grants permissions you don't have (${escalating.slice(0, 3).join(", ")}${escalating.length > 3 ? "…" : ""}).`,
    };
  }
  return { ok: true };
}

export function canGrantPermissions(
  actor: ActorContext,
  keys: string[]
): { ok: true } | { ok: false; error: string } {
  if (actor.isOwner) return { ok: true };
  const escalating = keys.filter((k) => !actor.effective.has(k as PermissionKey));
  if (escalating.length > 0) {
    return {
      ok: false,
      error: `You can't grant permissions you don't hold (${escalating.slice(0, 3).join(", ")}${escalating.length > 3 ? "…" : ""}).`,
    };
  }
  return { ok: true };
}

/**
 * Gate for mutations that target ANOTHER member's authority (suspend, remove,
 * role change). Owners are off-limits to non-Owners.
 */
export async function canManageMember(
  actor: ActorContext,
  targetMemberId: string
): Promise<{ ok: true; targetIsOwner: boolean } | { ok: false; error: string }> {
  const target = await prisma.member.findFirst({
    where: { id: targetMemberId, organizationId: actor.organizationId },
    include: { role: { select: { slug: true } } },
  });
  if (!target) return { ok: false, error: "Member not found." };
  const targetIsOwner = target.role.slug === "owner";
  if (targetIsOwner && !actor.isOwner) {
    return { ok: false, error: "Only an Owner can modify another Owner." };
  }
  return { ok: true, targetIsOwner };
}
