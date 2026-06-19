import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { IconChevronLeft } from "@tabler/icons-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { SequenceStatusBadge, sequenceState } from "@/features/sequences/sequence-badges";
import { SequenceDetailActions } from "@/features/sequences/sequence-detail-actions";
import {
  SequenceSteps,
  type SequenceStepRow,
} from "@/features/sequences/sequence-steps";

export const dynamic = "force-dynamic";

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!(await can("sequences.view"))) notFound();
  const orgId = session.member.organizationId;

  const sequence = await prisma.emailSequence.findFirst({
    where: { id, organizationId: orgId },
    include: {
      createdBy: { select: { name: true } },
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
  });
  if (!sequence) notFound();

  const [enrollmentGroups, followupsSent, canEdit, canDelete, canManage] =
    await Promise.all([
      prisma.emailSequenceEnrollment.groupBy({
        by: ["status"],
        where: { sequenceId: sequence.id },
        _count: { _all: true },
      }),
      prisma.emailEvent.count({
        where: {
          type: "FOLLOWUP_SENT",
          metadata: { path: ["sequenceId"], equals: sequence.id },
        },
      }),
      can("sequences.edit"),
      can("sequences.delete"),
      can("sequences.manage"),
    ]);

  const counts = { ACTIVE: 0, PAUSED: 0, COMPLETED: 0, STOPPED: 0 } as Record<string, number>;
  for (const g of enrollmentGroups) counts[g.status] = g._count._all;
  const totalEnrollments =
    counts.ACTIVE + counts.PAUSED + counts.COMPLETED + counts.STOPPED;
  const completionRate =
    totalEnrollments > 0 ? Math.round((counts.COMPLETED / totalEnrollments) * 100) : 0;

  const steps: SequenceStepRow[] = sequence.steps;
  const state = sequenceState(sequence);

  const stats: Array<{ label: string; value: string }> = [
    { label: "Steps", value: String(steps.length) },
    { label: "Enrollments", value: String(totalEnrollments) },
    { label: "Active", value: String(counts.ACTIVE) },
    { label: "Completed", value: String(counts.COMPLETED) },
    { label: "Stopped", value: String(counts.STOPPED) },
    { label: "Followups sent", value: String(followupsSent) },
    { label: "Completion rate", value: `${completionRate}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/sequences"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Sequences
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-display text-2xl text-[var(--color-foreground)] truncate">
                {sequence.name}
              </h1>
              <SequenceStatusBadge state={state} />
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Created {format(sequence.createdAt, "MMM d, yyyy")}
              {sequence.createdBy?.name ? ` · by ${sequence.createdBy.name}` : ""}
            </p>
            {sequence.description ? (
              <p className="mt-2 max-w-2xl text-[13px] text-[var(--color-muted-foreground)] whitespace-pre-wrap">
                {sequence.description}
              </p>
            ) : null}
          </div>

          <SequenceDetailActions
            sequence={{ id: sequence.id, name: sequence.name, description: sequence.description }}
            isActive={sequence.isActive}
            isArchived={Boolean(sequence.archivedAt)}
            canEdit={canEdit || canManage}
            canDelete={canDelete || canManage}
          />
        </div>
      </div>

      <section className="surface-card p-5">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
          Performance
        </h3>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {stats.map((c) => (
            <div
              key={c.label}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                {c.label}
              </dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-foreground)]">
                {c.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="surface-card p-5">
        <SequenceSteps sequenceId={sequence.id} steps={steps} canEdit={canEdit || canManage} />
      </section>
    </div>
  );
}
