import { cache } from "react";
import { getServerSession } from "@/lib/auth/session";
import { resolveEffectivePermissions } from "./resolve";
import type { PermissionKey } from "./registry";

/**
 * Server-side permission check for the currently active member.
 * Cached per request so repeated `can()` calls don't re-query.
 */
export const getEffectivePermissions = cache(async (): Promise<Set<PermissionKey>> => {
  const session = await getServerSession();
  if (!session) return new Set();
  return resolveEffectivePermissions(session.user.id, session.member.organizationId);
});

export async function can(permission: PermissionKey): Promise<boolean> {
  const perms = await getEffectivePermissions();
  return perms.has(permission);
}

export async function canAny(permissions: PermissionKey[]): Promise<boolean> {
  const perms = await getEffectivePermissions();
  return permissions.some((p) => perms.has(p));
}

export async function canAll(permissions: PermissionKey[]): Promise<boolean> {
  const perms = await getEffectivePermissions();
  return permissions.every((p) => perms.has(p));
}

export async function requirePermission(permission: PermissionKey) {
  if (!(await can(permission))) throw new Error(`FORBIDDEN: ${permission}`);
}
