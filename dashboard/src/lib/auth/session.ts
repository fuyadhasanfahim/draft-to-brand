import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./server";
import { prisma } from "@/lib/db";
import type { Member, Organization, Role, User } from "@prisma/client";

export type AuthUser = User;

export type ActiveMember = Member & {
  organization: Organization;
  role: Role;
};

export type AgencySession = {
  user: AuthUser;
  member: ActiveMember;
};

/**
 * Just the authenticated user (or null) — does not require a Member.
 * Use this when you need to distinguish "not signed in" from
 * "signed in but no workspace yet". Cached per request.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  return (session?.user as unknown as AuthUser) ?? null;
});

/**
 * Loads the active membership (with organization + role) for the current user.
 * Returns null if the user is not signed in OR has no active membership.
 * Phase 0 picks the user's oldest active membership; a workspace switcher
 * (future phase) can override by reading `Session.activeOrganizationId`.
 */
export const getActiveMember = cache(async (): Promise<ActiveMember | null> => {
  const user = await getAuthUser();
  if (!user) return null;
  return prisma.member.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: { organization: true, role: true },
    orderBy: { joinedAt: "asc" },
  });
});

/**
 * The strict session every protected route should consume: requires both
 * a verified user AND an active Member. Returns null on either miss —
 * callers decide how to route each case (auth → /sign-in,
 * no-workspace → /no-workspace).
 */
export const getServerSession = cache(async (): Promise<AgencySession | null> => {
  const [user, member] = await Promise.all([getAuthUser(), getActiveMember()]);
  if (!user || !member) return null;
  return { user, member };
});

export async function requireSession(): Promise<AgencySession> {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
