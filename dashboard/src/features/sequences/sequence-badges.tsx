import { Badge } from "@/components/ui";

type Variant = "primary" | "success" | "warning" | "neutral" | "danger";

/** Derived display state for a sequence (from isActive + archivedAt). */
export type SequenceState = "ACTIVE" | "PAUSED" | "ARCHIVED";

export type EnrollmentStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "STOPPED";

const SEQ_META: Record<SequenceState, { label: string; variant: Variant }> = {
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  ARCHIVED: { label: "Archived", variant: "neutral" },
};

const ENROLLMENT_META: Record<EnrollmentStatus, { label: string; variant: Variant }> = {
  ACTIVE: { label: "Active", variant: "success" },
  PAUSED: { label: "Paused", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "primary" },
  STOPPED: { label: "Stopped", variant: "neutral" },
};

export function sequenceState(s: { isActive: boolean; archivedAt: Date | null }): SequenceState {
  if (s.archivedAt) return "ARCHIVED";
  return s.isActive ? "ACTIVE" : "PAUSED";
}

export function SequenceStatusBadge({ state }: { state: SequenceState }) {
  const meta = SEQ_META[state];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const meta = ENROLLMENT_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
