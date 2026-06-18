import { format } from "date-fns";
import { IconClockHour3 } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui";
import type { EmailEventType } from "./campaign-event-types";

export type CampaignActivityEntry = {
  id: string;
  type: EmailEventType;
  createdAt: Date;
  recipientEmail: string;
  recipientName: string | null;
};

const LABELS: Record<EmailEventType, string> = {
  SENT: "Email sent",
  OPENED: "Email opened",
  CLICKED: "Link clicked",
  REPLIED: "Replied",
  BOUNCED: "Bounced",
};

const DOT: Record<EmailEventType, string> = {
  SENT: "bg-[var(--color-primary)]",
  OPENED: "bg-[var(--color-warning)]",
  CLICKED: "bg-[var(--color-warning)]",
  REPLIED: "bg-[var(--color-success)]",
  BOUNCED: "bg-[var(--color-danger)]",
};

/**
 * Campaign Activity tab — append-only EmailEvent timeline. Powers the audit /
 * analytics story. Empty until a future sending+tracking phase writes events.
 */
export function CampaignActivityTimeline({
  entries,
}: {
  entries: CampaignActivityEntry[];
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<IconClockHour3 size={20} />}
        title="No activity yet"
        description="Delivery events (sent, opened, clicked, bounced) appear here as recipients interact with the campaign."
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
          <span className={`mt-1.5 inline-block h-2 w-2 rounded-full shrink-0 ${DOT[e.type]}`} />
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-[13px] font-medium text-[var(--color-foreground)]">
                {LABELS[e.type]}
              </span>
              <span className="text-[11px] text-[var(--color-muted)]">
                {format(e.createdAt, "MMM d, yyyy · h:mm a")}
              </span>
            </div>
            <p className="text-[12px] text-[var(--color-muted-foreground)] truncate">
              {e.recipientName ? `${e.recipientName} · ` : ""}
              {e.recipientEmail || "—"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
