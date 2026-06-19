import "server-only";
import { prisma } from "@/lib/db";

/**
 * Suppression list helpers (Do Not Contact). Org-scoped, email-keyed.
 *
 * Every campaign + followup send is filtered through `filterSuppressed` so a
 * suppressed address is never mailed again, regardless of campaign. Writes go
 * through `addSuppression` (idempotent upsert) from unsubscribe / bounce /
 * complaint paths.
 */

export type SuppressionReason = "UNSUBSCRIBE" | "BOUNCE" | "COMPLAINT" | "MANUAL";

const norm = (email: string) => email.trim().toLowerCase();

/** Idempotent — upsert so re-suppressing the same address never throws. */
export async function addSuppression(args: {
  organizationId: string;
  email: string;
  reason: SuppressionReason;
  source?: string | null;
}): Promise<void> {
  const email = norm(args.email);
  if (!email) return;
  await prisma.suppressionList.upsert({
    where: { organizationId_email: { organizationId: args.organizationId, email } },
    create: {
      organizationId: args.organizationId,
      email,
      reason: args.reason,
      source: args.source ?? null,
    },
    // Keep the original reason/timestamp (first suppression wins); no-op update.
    update: {},
  });
}

/** True if this address is suppressed in the org. */
export async function isSuppressed(organizationId: string, email: string): Promise<boolean> {
  const row = await prisma.suppressionList.findUnique({
    where: { organizationId_email: { organizationId, email: norm(email) } },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Given a list of emails, return the set (lowercased) that are suppressed in the
 * org. One query — no N+1. Callers filter their recipient list against it.
 */
export async function suppressedEmailSet(
  organizationId: string,
  emails: string[]
): Promise<Set<string>> {
  const normalized = [...new Set(emails.map(norm).filter(Boolean))];
  if (normalized.length === 0) return new Set();
  const rows = await prisma.suppressionList.findMany({
    where: { organizationId, email: { in: normalized } },
    select: { email: true },
  });
  return new Set(rows.map((r) => r.email));
}
