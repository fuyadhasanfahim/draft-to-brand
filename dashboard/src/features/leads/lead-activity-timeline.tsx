import { format } from "date-fns";
import { IconClockHour3 } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui";

export type LeadActivityEntry = {
  id: string;
  type: string;
  message: string | null;
  createdAt: Date;
  createdBy: { name: string; image: string | null } | null;
};

const LABELS: Record<string, string> = {
  "lead.created":   "Lead created",
  "lead.updated":   "Lead updated",
  "lead.archived":  "Lead archived",
  "lead.restored":  "Lead restored",
  "stage.changed":  "Stage changed",
  "owner.changed":  "Owner changed",
  "note.added":     "Note added",
};

export function LeadActivityTimeline({ entries }: { entries: LeadActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<IconClockHour3 size={20} />}
        title="No activity yet"
        description="Updates to this lead will show up here."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <span className="mt-1.5 inline-block h-2 w-2 rounded-full bg-[var(--color-primary)] shrink-0" />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[13px] font-medium text-[var(--color-foreground)]">
                {LABELS[e.type] ?? e.type}
              </span>
              <span className="text-[11px] text-[var(--color-muted)]">
                {format(e.createdAt, "MMM d, yyyy · h:mm a")}
              </span>
            </div>
            {e.message ? (
              <p className="text-[12px] text-[var(--color-muted-foreground)]">{e.message}</p>
            ) : null}
            {e.createdBy?.name ? (
              <p className="text-[11px] text-[var(--color-muted)]">by {e.createdBy.name}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
