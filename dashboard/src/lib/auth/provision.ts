import "server-only";
import { prisma } from "@/lib/db";

/**
 * Attaches a freshly-created auth user to a workspace so they can actually
 * use the app on first sign-in. Phase 0 rule:
 *
 *   - If a default Organization exists (one was seeded), give them an
 *     Employee role membership there.
 *   - Otherwise, do nothing — the dashboard layout will route them to
 *     /no-workspace and a human can invite or onboard them later.
 *
 * Idempotent: relies on the `(userId, organizationId)` unique constraint
 * on Member, so concurrent or retried signups won't double-insert.
 */
export async function provisionMemberForNewUser(userId: string): Promise<void> {
  const org = await prisma.organization.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!org) return;

  const role = await prisma.role.findFirst({
    where: { organizationId: org.id, slug: "employee", isSystem: true },
  });
  if (!role) return;

  const existing = await prisma.member.findUnique({
    where: { userId_organizationId: { userId, organizationId: org.id } },
  });
  if (existing) return;

  await prisma.member.create({
    data: {
      userId,
      organizationId: org.id,
      roleId: role.id,
      status: "ACTIVE",
    },
  });
}
