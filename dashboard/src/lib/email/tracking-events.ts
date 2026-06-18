import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

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
 * unconditionally. Returns true if this was the first bounce. `payload` is the
 * raw webhook event, stored on the event for forensics.
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
  return true;
}
