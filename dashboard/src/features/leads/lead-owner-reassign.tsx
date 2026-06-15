"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select, useToast } from "@/components/ui";
import { reassignLeadOwnerAction } from "@/actions/leads";

/**
 * Inline owner reassign control for the Lead detail page. Owner is no longer
 * collected at create time (server auto-sets it to the current member), so
 * this is the only path to change it later.
 */
export function LeadOwnerReassign({
  leadId,
  currentOwnerId,
  owners,
  disabled,
}: {
  leadId: string;
  currentOwnerId: string | null;
  owners: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = React.useState(currentOwnerId ?? "");
  const [pending, startTransition] = React.useTransition();

  const onChange = (next: string) => {
    setValue(next);
    startTransition(async () => {
      const res = await reassignLeadOwnerAction({
        leadId,
        ownerId: next || null,
      });
      if (!res.ok) {
        toast({ variant: "error", title: "Couldn't reassign", description: res.error });
        setValue(currentOwnerId ?? "");
        return;
      }
      toast({ variant: "success", title: "Owner updated" });
      router.refresh();
    });
  };

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || pending}
      className="h-9 text-xs"
    >
      <option value="">Unassigned</option>
      {owners.map((o) => (
        <option key={o.id} value={o.id}>{o.name}</option>
      ))}
    </Select>
  );
}
