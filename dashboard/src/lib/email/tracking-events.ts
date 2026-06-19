import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { addSuppression } from "@/lib/email/suppression";

/** Move a recipient's ACTIVE sequence enrollments to STOPPED (reply/bounce/complaint). */
async function stopEnrollments(recipientId: string): Promise<void> {
  await prisma.emailSequenceEnrollment.updateMany({
    where: { recipientId, status: "ACTIVE" },
    data: { status: "STOPPED", completedAt: new Date(), nextRunAt: null, lockedAt: null },
  });
}

/**
 * Email tracking writes (Phase 2B) — shared by the open/click/webhook routes.
 *
 * First-event-wins is enforced atomically by a guarded `updateMany` on the
 * relevant `…At IS NULL` column: under concurrent hits Postgres row-locks the
 * row, so exactly one update returns `count === 1` and only that caller writes
 * the EmailEvent. Subsequent (or duplicate) hits get `count === 0` and no-op.
 * This means no duplicate OPENED/CLICKED/BOUNCED events without needing a
 * unique index or an explicit lock.
 *
 * Status only ever moves forward (SENT → OPENED → CLICKED); we never downgrade,
 * and BOUNCED is terminal.
 */

/** Record the first open for a recipient. Returns true if this hit was the first. */
export async function recordOpen(recipientId: string): Promise<boolean> {
  const gate = await prisma.emailRecipient.updateMany({
    where: { id: recipientId, openedAt: null },
    data: { openedAt: new Date() },
  });
  if (gate.count === 0) return false;

  await prisma.$transaction([
    // Advance SENT → OPENED only. Don't downgrade CLICKED/REPLIED; don't touch BOUNCED.
    prisma.emailRecipient.updateMany({
      where: { id: recipientId, status: "SENT" },
      data: { status: "OPENED" },
    }),
    prisma.emailEvent.create({ data: { recipientId, type: "OPENED" } }),
  ]);
  return true;
}

/** Record the first click for a recipient. Returns true if this hit was the first. */
export async function recordClick(recipientId: string, url: string): Promise<boolean> {
  const gate = await prisma.emailRecipient.updateMany({
    where: { id: recipientId, clickedAt: null },
    data: { clickedAt: new Date() },
  });
  if (gate.count === 0) return false;

  await prisma.$transaction([
    // Advance SENT/OPENED → CLICKED. Don't downgrade REPLIED; don't touch BOUNCED.
    prisma.emailRecipient.updateMany({
      where: { id: recipientId, status: { in: ["SENT", "OPENED"] } },
      data: { status: "CLICKED" },
    }),
    prisma.emailEvent.create({
      data: { recipientId, type: "CLICKED", metadata: { url } as Prisma.InputJsonValue },
    }),
  ]);
  return true;
}

/**
 * Record the first bounce for a recipient. BOUNCED is terminal, so status is set
 * unconditionally. Also suppresses the address (never re-mail a hard bounce) and
 * stops any active sequence enrollments. Returns true if this was the first
 * bounce. `payload` is the raw webhook event, stored on the event for forensics.
 */
export async function recordBounce(
  recipientId: string,
  payload: unknown
): Promise<boolean> {
  const gate = await prisma.emailRecipient.updateMany({
    where: { id: recipientId, bouncedAt: null },
    data: { bouncedAt: new Date(), status: "BOUNCED" },
  });
  if (gate.count === 0) return false;

  await prisma.emailEvent.create({
    data: {
      recipientId,
      type: "BOUNCED",
      metadata: (payload ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

  // Suppress + stop sequences (best-effort; never throw out of tracking).
  const recipient = await prisma.emailRecipient.findUnique({
    where: { id: recipientId },
    select: { email: true, campaign: { select: { organizationId: true } } },
  });
  if (recipient?.email) {
    await addSuppression({
      organizationId: recipient.campaign.organizationId,
      email: recipient.email,
      reason: "BOUNCE",
      source: `recipient:${recipientId}`,
    });
  }
  await stopEnrollments(recipientId);
  return true;
}

/**
 * Record the first reply for a recipient. Sets `repliedAt` + status REPLIED
 * (forward-only — never overrides BOUNCED), writes a REPLIED event, and **stops
 * active sequence enrollments**. A reply does NOT suppress the address (it's
 * engagement, not opt-out). Returns true if this was the first reply.
 */
export async function recordReply(recipientId: string): Promise<boolean> {
  const gate = await prisma.emailRecipient.updateMany({
    where: { id: recipientId, repliedAt: null },
    data: { repliedAt: new Date() },
  });
  if (gate.count === 0) return false;

  await prisma.$transaction([
    // Advance SENT/OPENED/CLICKED → REPLIED. Don't override terminal BOUNCED.
    prisma.emailRecipient.updateMany({
      where: { id: recipientId, status: { in: ["SENT", "OPENED", "CLICKED"] } },
      data: { status: "REPLIED" },
    }),
    prisma.emailEvent.create({ data: { recipientId, type: "REPLIED" } }),
    prisma.emailSequenceEnrollment.updateMany({
      where: { recipientId, status: "ACTIVE" },
      data: { status: "STOPPED", completedAt: new Date(), nextRunAt: null, lockedAt: null },
    }),
  ]);
  return true;
}

/**
 * Record a spam complaint. Suppresses the address (COMPLAINT) and stops active
 * sequences. No dedicated event/status (no COMPLAINED enum) — the suppression
 * row is the record. Idempotent.
 */
export async function recordComplaint(recipientId: string): Promise<boolean> {
  const recipient = await prisma.emailRecipient.findUnique({
    where: { id: recipientId },
    select: { email: true, campaign: { select: { organizationId: true } } },
  });
  if (!recipient?.email) return false;

  await addSuppression({
    organizationId: recipient.campaign.organizationId,
    email: recipient.email,
    reason: "COMPLAINT",
    source: `recipient:${recipientId}`,
  });
  await stopEnrollments(recipientId);
  return true;
}
