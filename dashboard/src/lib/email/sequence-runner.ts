import "server-only";
import { addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send-email";
import { buildFrom } from "@/lib/email/from";
import { conditionPasses } from "@/lib/email/sequence-conditions";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import CampaignEmail from "@/emails/templates/campaign-email";

/** A claimed lock older than this is considered stale (crashed run) and reclaimable. */
const LOCK_STALE_MS = 15 * 60 * 1000;

/**
 * Followup sequence engine (Phase 3).
 *
 *   - `enrollSentRecipients` enrolls a campaign's just-sent recipients into the
 *     attached sequence (called from sendCampaignAction).
 *   - `runSequenceScheduler` is the poll-based worker: it finds ACTIVE
 *     enrollments whose `nextRunAt` is due, evaluates each step's condition
 *     against the recipient's tracking state, sends the followup (reusing the
 *     existing email + tracking stack), and advances the enrollment.
 *
 * No queue yet — a single bounded poll per invocation (see `/api/cron/sequences`).
 * The architecture is queue-ready: each enrollment is processed independently
 * and idempotently (idempotencyKey per step), so the loop body can later be
 * fanned out to workers without changing the data model.
 */

/**
 * Enroll the given recipients into a sequence at send time. nextRunAt for the
 * first step is `baseTime + step1.delayDays`. No-ops if the sequence is
 * inactive/archived or has no steps. Idempotent via the unique
 * (sequenceId, recipientId) constraint.
 */
export async function enrollSentRecipients(
  sequenceId: string,
  recipientIds: string[],
  baseTime: Date
): Promise<number> {
  if (recipientIds.length === 0) return 0;

  const sequence = await prisma.emailSequence.findUnique({
    where: { id: sequenceId },
    select: {
      isActive: true,
      archivedAt: true,
      steps: {
        orderBy: { stepNumber: "asc" },
        take: 1,
        select: { delayDays: true },
      },
    },
  });
  if (!sequence || !sequence.isActive || sequence.archivedAt) return 0;
  const firstStep = sequence.steps[0];
  if (!firstStep) return 0; // nothing to schedule

  const nextRunAt = addDays(baseTime, firstStep.delayDays);
  const result = await prisma.emailSequenceEnrollment.createMany({
    data: recipientIds.map((recipientId) => ({
      sequenceId,
      recipientId,
      currentStep: 0,
      status: "ACTIVE" as const,
      nextRunAt,
      enrolledAt: baseTime,
    })),
    skipDuplicates: true,
  });
  return result.count;
}

export type SchedulerSummary = {
  processed: number;
  sent: number;
  skipped: number;
  stopped: number;
  completed: number;
  failed: number;
};

/**
 * Process due enrollments. Bounded by `limit` per call so a single invocation
 * can't run unbounded; the cron simply runs again for the rest.
 */
export async function runSequenceScheduler(opts?: {
  limit?: number;
  now?: Date;
}): Promise<SchedulerSummary> {
  const limit = opts?.limit ?? 200;
  const now = opts?.now ?? new Date();

  const summary: SchedulerSummary = {
    processed: 0,
    sent: 0,
    skipped: 0,
    stopped: 0,
    completed: 0,
    failed: 0,
  };

  const staleBefore = new Date(now.getTime() - LOCK_STALE_MS);

  // Single query, no N+1 — pulls each due enrollment with its sequence steps and
  // recipient state. Bounded by `limit` and the [status, nextRunAt] index.
  // Unlocked OR stale-locked (a crashed run) enrollments are eligible.
  const due = await prisma.emailSequenceEnrollment.findMany({
    where: {
      status: "ACTIVE",
      nextRunAt: { lte: now },
      sequence: { isActive: true, archivedAt: null },
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
    },
    orderBy: { nextRunAt: "asc" },
    take: limit,
    include: {
      sequence: {
        select: {
          id: true,
          organizationId: true,
          steps: {
            orderBy: { stepNumber: "asc" },
            select: {
              id: true,
              stepNumber: true,
              delayDays: true,
              subject: true,
              body: true,
              condition: true,
            },
          },
        },
      },
      recipient: {
        select: {
          id: true,
          email: true,
          firstName: true,
          status: true,
          openedAt: true,
          clickedAt: true,
          repliedAt: true,
          campaign: { select: { fromName: true, replyTo: true } },
        },
      },
    },
  });

  // Batch suppression lookup for the whole due set — one query, no N+1. Keyed by
  // org+email so a suppression in another tenant can't cross over.
  const dueEmails = due.map((d) => d.recipient.email).filter(Boolean);
  const suppressionRows = dueEmails.length
    ? await prisma.suppressionList.findMany({
        where: { email: { in: dueEmails.map((e) => e.trim().toLowerCase()) } },
        select: { organizationId: true, email: true },
      })
    : [];
  const suppressedKeys = new Set(
    suppressionRows.map((r) => `${r.organizationId}:${r.email}`)
  );

  for (const enrollment of due) {
    const r = enrollment.recipient;
    const steps = enrollment.sequence.steps;
    const orgId = enrollment.sequence.organizationId;

    // ── Atomic claim ──────────────────────────────────────────────────────────
    // Assert (id, ACTIVE, same currentStep, unlocked/stale) → set lockedAt. If a
    // concurrent run already claimed or advanced this enrollment, count === 0 and
    // we skip it. This prevents duplicate sends AND duplicate FOLLOWUP_SENT events
    // for the same (enrollment, step).
    const claim = await prisma.emailSequenceEnrollment.updateMany({
      where: {
        id: enrollment.id,
        status: "ACTIVE",
        currentStep: enrollment.currentStep,
        OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
      },
      data: { lockedAt: now },
    });
    if (claim.count === 0) continue; // someone else owns it this tick

    summary.processed += 1;

    // Safety: never followup a replied/bounced/suppressed recipient — stop.
    const isSuppressed = suppressedKeys.has(`${orgId}:${r.email.trim().toLowerCase()}`);
    if (r.status === "REPLIED" || r.status === "BOUNCED" || isSuppressed) {
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "STOPPED", completedAt: now, nextRunAt: null, lockedAt: null },
      });
      summary.stopped += 1;
      continue;
    }

    const step = steps[enrollment.currentStep];
    if (!step) {
      // Pointer past the end — nothing left to do.
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED", completedAt: now, nextRunAt: null, lockedAt: null },
      });
      summary.completed += 1;
      continue;
    }

    // Evaluate the step's gate against the recipient's tracking state.
    const passes = conditionPasses(step.condition, {
      openedAt: r.openedAt,
      clickedAt: r.clickedAt,
      repliedAt: r.repliedAt,
    });

    if (passes && r.email) {
      const unsub = unsubscribeUrl(r.id);
      const res = await sendEmail({
        to: r.email,
        subject: step.subject,
        // recipientId reuses the Phase 2B open/click tracking on followups.
        react: CampaignEmail({
          body: step.body,
          firstName: r.firstName,
          recipientId: r.id,
          unsubscribeUrl: unsub,
        }),
        from: buildFrom(r.campaign.fromName),
        replyTo: r.campaign.replyTo ?? undefined,
        tags: [{ name: "category", value: "followup" }],
        headers: {
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        idempotencyKey: `seq_${enrollment.id}_step_${step.id}`,
      });

      if (res.ok) {
        await prisma.emailEvent.create({
          data: {
            recipientId: r.id,
            type: "FOLLOWUP_SENT",
            metadata: {
              messageId: res.id,
              sequenceId: enrollment.sequence.id,
              stepId: step.id,
              stepNumber: step.stepNumber,
            } as Prisma.InputJsonValue,
          },
        });
        await logAudit({
          organizationId: enrollment.sequence.organizationId,
          actorUserId: null, // system-driven send
          action: "followup.sent",
          resource: "sequence",
          resourceId: enrollment.sequence.id,
          metadata: {
            enrollmentId: enrollment.id,
            recipientId: r.id,
            stepId: step.id,
            stepNumber: step.stepNumber,
          },
        });
        summary.sent += 1;
      } else {
        // Send failed — log and advance (don't retry forever). The recipient
        // keeps moving through the sequence.
        console.error(
          `[sequences] followup send failed (enrollment ${enrollment.id}, step ${step.id}): ${res.error}`
        );
        summary.failed += 1;
      }
    } else {
      // Condition not met (or no address) — skip this step, no email/event.
      summary.skipped += 1;
    }

    // Advance the pointer regardless of send/skip, and release the lock so the
    // next tick can claim the next step.
    const nextIndex = enrollment.currentStep + 1;
    if (nextIndex < steps.length) {
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentStep: nextIndex,
          // delayDays is an offset from enrollment, so each step's run time is
          // enrolledAt + that step's delay.
          nextRunAt: addDays(enrollment.enrolledAt, steps[nextIndex].delayDays),
          lockedAt: null,
        },
      });
    } else {
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentStep: nextIndex,
          status: "COMPLETED",
          completedAt: now,
          nextRunAt: null,
          lockedAt: null,
        },
      });
      summary.completed += 1;
    }
  }

  return summary;
}
