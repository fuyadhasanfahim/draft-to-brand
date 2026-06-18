/**
 * Campaign analytics — pure, database-derived calculations (no estimates).
 *
 * Computed from per-recipient timestamps rather than the `status` enum so the
 * numbers stay accurate after a recipient advances (e.g. someone who clicked
 * still counts as "opened"). Used by both the list page (per-row rates) and the
 * detail page (full stat block).
 */

export type RecipientStatRow = {
  sentAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  repliedAt: Date | null;
  bouncedAt: Date | null;
};

export type CampaignStats = {
  recipients: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  /** opened / sent (0–1). 0 when nothing has been sent. */
  openRate: number;
  /** replied / sent (0–1). 0 when nothing has been sent. */
  replyRate: number;
  /** clicked / sent (0–1). 0 when nothing has been sent. */
  clickRate: number;
  /** bounced / sent (0–1). 0 when nothing has been sent. */
  bounceRate: number;
};

export function computeCampaignStats(rows: RecipientStatRow[]): CampaignStats {
  const recipients = rows.length;
  const sent = rows.filter((r) => r.sentAt).length;
  const opened = rows.filter((r) => r.openedAt).length;
  const clicked = rows.filter((r) => r.clickedAt).length;
  const replied = rows.filter((r) => r.repliedAt).length;
  const bounced = rows.filter((r) => r.bouncedAt).length;

  const rate = (n: number) => (sent > 0 ? n / sent : 0);

  return {
    recipients,
    sent,
    opened,
    clicked,
    replied,
    bounced,
    openRate: rate(opened),
    replyRate: rate(replied),
    clickRate: rate(clicked),
    bounceRate: rate(bounced),
  };
}

/** Format a 0–1 rate as a percent string, e.g. 0.42 → "42%". */
export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
