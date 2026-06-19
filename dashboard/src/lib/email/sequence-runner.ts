import "server-only";
import { addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send-email";
import { buildFrom } from "@/lib/email/from";
import { conditionPasses } from "@/lib/email/sequence-conditions";
import CampaignEmail from "@/emails/templates/campaign-email";

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

  // Single query, no N+1 — pulls each due enrollment with its sequence steps and
  // recipient state. Bounded by `limit` and the [status, nextRunAt] index.
  const due = await prisma.emailSequenceEnrollment.findMany({
    where: {
      status: "ACTIVE",
      nextRunAt: { lte: now },
      sequence: { isActive: true, archivedAt: null },
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

  for (const enrollment of due) {
    summary.processed += 1;
    const r = enrollment.recipient;
    const steps = enrollment.sequence.steps;

    // Safety: never followup a replied/bounced recipient — stop the sequence.
    if (r.status === "REPLIED" || r.status === "BOUNCED") {
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "STOPPED", completedAt: now, nextRunAt: null },
      });
      summary.stopped += 1;
      continue;
    }

    const step = steps[enrollment.currentStep];
    if (!step) {
      // Pointer past the end — nothing left to do.
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: "COMPLETED", completedAt: now, nextRunAt: null },
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
      const res = await sendEmail({
        to: r.email,
        subject: step.subject,
        // recipientId reuses the Phase 2B open/click tracking on followups.
        react: CampaignEmail({ body: step.body, firstName: r.firstName, recipientId: r.id }),
        from: buildFrom(r.campaign.fromName),
        replyTo: r.campaign.replyTo ?? undefined,
        tags: [{ name: "category", value: "followup" }],
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

    // Advance the pointer regardless of send/skip.
    const nextIndex = enrollment.currentStep + 1;
    if (nextIndex < steps.length) {
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentStep: nextIndex,
          // delayDays is an offset from enrollment, so each step's run time is
          // enrolledAt + that step's delay.
          nextRunAt: addDays(enrollment.enrolledAt, steps[nextIndex].delayDays),
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
        },
      });
      summary.completed += 1;
    }
  }

  return summary;
}
