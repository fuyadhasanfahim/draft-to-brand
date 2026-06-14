import { prisma } from "@/lib/db";
import { PermissionEffect } from "@prisma/client";
import type { PermissionKey } from "./registry";

/**
 * Resolves the effective permission set for a (user, organization) pair.
 *
 * Resolution order:
 *   1. Start with the keys granted by the user's Role via RolePermission.
 *   2. Apply UserPermission overrides:
 *        - effect = ALLOW → add to the set
 *        - effect = DENY  → remove from the set (DENY always wins)
 *
 * The result is the authoritative set the `can()` helper checks against.
 */
export async function resolveEffectivePermissions(
  userId: string,
  organizationId: string
): Promise<Set<PermissionKey>> {
  const member = await prisma.member.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: {
      role: {
        include: { rolePermissions: { include: { permission: true } } },
      },
    },
  });

  if (!member || member.status !== "ACTIVE") return new Set();

  const granted = new Set<PermissionKey>(
    member.role.rolePermissions.map((rp) => rp.permission.key as PermissionKey)
  );

  const overrides = await prisma.userPermission.findMany({
    where: { userId, organizationId },
    include: { permission: true },
  });

  for (const o of overrides) {
    const key = o.permission.key as PermissionKey;
    if (o.effect === PermissionEffect.ALLOW) granted.add(key);
    else granted.delete(key);
  }

  return granted;
}
