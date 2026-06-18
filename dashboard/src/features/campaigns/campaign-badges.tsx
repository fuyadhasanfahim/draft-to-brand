import { Badge } from "@/components/ui";

type Variant = "primary" | "success" | "warning" | "neutral" | "danger";

export type CampaignStatus = "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
export type RecipientStatus =
  | "PENDING"
  | "SENT"
  | "OPENED"
  | "CLICKED"
  | "REPLIED"
  | "BOUNCED";

const CAMPAIGN_META: Record<CampaignStatus, { label: string; variant: Variant }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  RUNNING: { label: "Running", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "primary" },
};

const RECIPIENT_META: Record<RecipientStatus, { label: string; variant: Variant }> = {
  PENDING: { label: "Pending", variant: "neutral" },
  SENT: { label: "Sent", variant: "primary" },
  OPENED: { label: "Opened", variant: "warning" },
  CLICKED: { label: "Clicked", variant: "warning" },
  REPLIED: { label: "Replied", variant: "success" },
  BOUNCED: { label: "Bounced", variant: "danger" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const meta = CAMPAIGN_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function RecipientStatusBadge({ status }: { status: RecipientStatus }) {
  const meta = RECIPIENT_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
