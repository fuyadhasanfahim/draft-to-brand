import { format } from "date-fns";
import type { CampaignStats } from "./analytics";
import { formatRate } from "./analytics";

/**
 * Campaign Overview tab — campaign metadata + the basic analytics block.
 * All numbers are database-derived (see analytics.ts); nothing is estimated.
 */
export function CampaignOverview({
  campaign,
  stats,
  followupsSent,
}: {
  campaign: {
    subject: string;
    body: string;
    fromName: string | null;
    replyTo: string | null;
    createdByName: string | null;
    createdAt: Date;
  };
  stats: CampaignStats;
  /** Phase 3 — count of FOLLOWUP_SENT events across this campaign's recipients. */
  followupsSent?: number;
}) {
  const cards: Array<{ label: string; value: string }> = [
    { label: "Recipients", value: String(stats.recipients) },
    { label: "Sent", value: String(stats.sent) },
    { label: "Opened", value: String(stats.opened) },
    { label: "Clicked", value: String(stats.clicked) },
    { label: "Replied", value: String(stats.replied) },
    { label: "Bounced", value: String(stats.bounced) },
    { label: "Open rate", value: formatRate(stats.openRate) },
    { label: "Click rate", value: formatRate(stats.clickRate) },
    { label: "Bounce rate", value: formatRate(stats.bounceRate) },
    { label: "Reply rate", value: formatRate(stats.replyRate) },
    ...(followupsSent !== undefined
      ? [{ label: "Followups sent", value: String(followupsSent) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <section className="surface-card p-5">
        <h3 className="mb-4 text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
          Performance
        </h3>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((c) => (
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
        <h3 className="mb-3 text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
          Email
        </h3>
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Subject
            </dt>
            <dd className="mt-0.5 text-[13px] text-[var(--color-foreground)]">
              {campaign.subject}
            </dd>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                From name
              </dt>
              <dd className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">
                {campaign.fromName ?? "Workspace default"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                Reply-to
              </dt>
              <dd className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">
                {campaign.replyTo ?? "Workspace default"}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Body
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--color-muted-foreground)]">
              {campaign.body}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Created
            </dt>
            <dd className="mt-0.5 text-[12px] text-[var(--color-muted-foreground)]">
              {format(campaign.createdAt, "MMM d, yyyy")}
              {campaign.createdByName ? ` · by ${campaign.createdByName}` : ""}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
