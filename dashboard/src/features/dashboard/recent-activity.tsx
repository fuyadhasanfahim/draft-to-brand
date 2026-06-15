import Link from "next/link";
import { format } from "date-fns";
import { IconClockHour3 } from "@tabler/icons-react";
import { Avatar, EmptyState } from "@/components/ui";

export type ActivityRow = {
  id: string;
  type: string;
  message: string | null;
  createdAt: Date;
  lead: { id: string; title: string } | null;
  createdBy: { name: string; image: string | null } | null;
};

const LABELS: Record<string, string> = {
  "lead.created":  "Lead created",
  "lead.updated":  "Lead updated",
  "stage.changed": "Stage changed",
  "owner.changed": "Owner changed",
  "lead.archived": "Lead archived",
  "lead.restored": "Lead restored",
};

export function RecentActivity({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<IconClockHour3 size={20} />}
        title="No activity yet"
        description="Lead creation, stage moves, and ownership changes will show up here."
      />
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-[var(--color-border)] surface-card overflow-hidden">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex gap-3 px-4 py-3 hover:bg-[var(--color-background)] transition-colors"
        >
          <Avatar
            src={r.createdBy?.image ?? undefined}
            name={r.createdBy?.name ?? "System"}
            size="sm"
            className="shrink-0"
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="text-[13px] font-medium text-[var(--color-foreground)]">
                {LABELS[r.type] ?? r.type}
              </span>
              {r.lead ? (
                <Link
                  href={`/dashboard/leads/${r.lead.id}`}
                  className="text-[12px] text-[var(--color-primary)] hover:underline truncate max-w-[260px]"
                >
                  {r.lead.title}
                </Link>
              ) : null}
              <span className="text-[11px] text-[var(--color-muted)]">
                {format(r.createdAt, "MMM d · h:mm a")}
              </span>
            </div>
            {r.message ? (
              <p className="text-[12px] text-[var(--color-muted-foreground)] truncate">
                {r.message}
              </p>
            ) : null}
            {r.createdBy?.name ? (
              <p className="text-[11px] text-[var(--color-muted)]">by {r.createdBy.name}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
