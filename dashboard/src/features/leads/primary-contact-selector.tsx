"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Select, useToast } from "@/components/ui";
import { setPrimaryContactAction } from "@/actions/companies";

/**
 * Pick which contact at the linked company is the "main POC". Used from the
 * Lead detail Company tab. Companies hold the primaryContactId; deleting that
 * contact nulls the FK automatically (Contact onDelete: SetNull).
 */
export function PrimaryContactSelector({
  companyId,
  primaryContactId,
  contacts,
  disabled,
}: {
  companyId: string;
  primaryContactId: string | null;
  contacts: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = React.useState(primaryContactId ?? "");
  const [pending, startTransition] = React.useTransition();

  const onChange = (next: string) => {
    setValue(next);
    startTransition(async () => {
      const res = await setPrimaryContactAction({
        companyId,
        contactId: next || null,
      });
      if (!res.ok) {
        toast({ variant: "error", title: "Couldn't update", description: res.error });
        setValue(primaryContactId ?? "");
        return;
      }
      toast({ variant: "success", title: "Primary contact updated" });
      router.refresh();
    });
  };

  if (contacts.length === 0) {
    return (
      <p className="text-[12px] text-[var(--color-muted)]">
        No contacts attached to this company yet.
      </p>
    );
  }

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || pending}
      className="h-9 text-xs"
    >
      <option value="">— No primary —</option>
      {contacts.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </Select>
  );
}
