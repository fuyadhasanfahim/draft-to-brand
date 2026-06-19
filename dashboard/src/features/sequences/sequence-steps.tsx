"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconClock, IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Badge, Button, EmptyState, useToast } from "@/components/ui";
import { deleteSequenceStepAction } from "@/actions/sequences";
import { CONDITION_LABELS } from "@/lib/email/sequence-conditions";
import { SequenceStepDialog, type StepEditable } from "./sequence-step-dialog";

export type SequenceStepRow = StepEditable & { stepNumber: number };

export function SequenceSteps({
  sequenceId,
  steps,
  canEdit,
}: {
  sequenceId: string;
  steps: SequenceStepRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [dialog, setDialog] = React.useState<
    { mode: "create" } | { mode: "edit"; step: StepEditable } | null
  >(null);

  const onDelete = async (stepId: string) => {
    if (!confirm("Delete this step? Recipients already past it are unaffected.")) return;
    const res = await deleteSequenceStepAction({ stepId });
    if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
          Steps ({steps.length})
        </h3>
        {canEdit ? (
          <Button variant="secondary" size="sm" onClick={() => setDialog({ mode: "create" })}>
            <IconPlus size={14} /> Add step
          </Button>
        ) : null}
      </div>

      {steps.length === 0 ? (
        <EmptyState
          title="No steps yet"
          description={canEdit ? "Add the first followup step." : "This sequence has no steps."}
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {steps.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-background)] text-[12px] font-semibold text-[var(--color-foreground)] border border-[var(--color-border)] shrink-0">
                {s.stepNumber}
              </span>
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-[var(--color-foreground)] truncate">
                    {s.subject}
                  </span>
                  <Badge variant="neutral">{CONDITION_LABELS[s.condition]}</Badge>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-muted)]">
                  <IconClock size={12} /> Day {s.delayDays} after send
                </span>
                <p className="mt-1 text-[12px] text-[var(--color-muted-foreground)] line-clamp-2 whitespace-pre-wrap">
                  {s.body}
                </p>
              </div>
              {canEdit ? (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit step"
                    onClick={() => setDialog({ mode: "edit", step: s })}
                  >
                    <IconEdit size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete step"
                    onClick={() => onDelete(s.id)}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {dialog ? (
        <SequenceStepDialog
          open
          onOpenChange={(v) => !v && setDialog(null)}
          sequenceId={sequenceId}
          step={dialog.mode === "edit" ? dialog.step : undefined}
        />
      ) : null}
    </div>
  );
}
