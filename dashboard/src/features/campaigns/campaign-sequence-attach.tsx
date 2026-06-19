"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconMailFast } from "@tabler/icons-react";
import { Select, useToast } from "@/components/ui";
import { attachSequenceAction } from "@/actions/sequences";

export type SequenceOption = { id: string; name: string };

/**
 * Campaign "followup sequence" panel. Editable only while the campaign is DRAFT
 * (enrollment happens at send time, so attaching afterward wouldn't enroll the
 * already-sent recipients). Otherwise shows the attached sequence read-only.
 */
export function CampaignSequenceAttach({
  campaignId,
  status,
  currentSequenceId,
  currentSequenceName,
  sequences,
  canEdit,
}: {
  campaignId: string;
  status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
  currentSequenceId: string | null;
  currentSequenceName: string | null;
  sequences: SequenceOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  const editable = canEdit && status === "DRAFT";

  const onChange = async (value: string) => {
    setSaving(true);
    const res = await attachSequenceAction({
      campaignId,
      sequenceId: value === "" ? null : value,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't update", description: res.error });
      return;
    }
    toast({ variant: "success", title: value ? "Sequence attached" : "Sequence detached" });
    router.refresh();
  };

  return (
    <section className="surface-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[var(--color-muted)]">
          <IconMailFast size={15} />
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
          Followup sequence
        </h3>
      </div>

      {editable ? (
        <>
          <Select
            value={currentSequenceId ?? ""}
            disabled={saving}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-sm"
          >
            <option value="">No sequence</option>
            {sequences.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <p className="mt-2 text-[12px] text-[var(--color-muted-foreground)]">
            Recipients are enrolled into this sequence automatically when the
            campaign is sent.
          </p>
        </>
      ) : (
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          {currentSequenceId ? (
            <>
              Attached:{" "}
              <Link
                href={`/dashboard/sequences/${currentSequenceId}`}
                className="text-[var(--color-primary)] hover:underline"
              >
                {currentSequenceName ?? "sequence"}
              </Link>
              {status !== "DRAFT" ? " · enrollment locked after send" : null}
            </>
          ) : (
            "No followup sequence attached."
          )}
        </p>
      )}
    </section>
  );
}
