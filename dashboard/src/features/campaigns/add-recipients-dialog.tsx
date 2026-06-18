"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, useToast } from "@/components/ui";
import { addRecipientsAction } from "@/actions/campaigns";
import {
  RecipientSelector,
  type ContactOption,
  type LeadOption,
  type RecipientSelection,
} from "./recipient-selector";

export function AddRecipientsDialog({
  open,
  onOpenChange,
  campaignId,
  contacts,
  leads,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaignId: string;
  /** Already excludes contacts/leads currently on the campaign. */
  contacts: ContactOption[];
  leads: LeadOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [selection, setSelection] = React.useState<RecipientSelection>({
    contactIds: [],
    leadIds: [],
  });
  const [saving, setSaving] = React.useState(false);

  const count = selection.contactIds.length + selection.leadIds.length;

  const onSave = async () => {
    setSaving(true);
    const res = await addRecipientsAction({
      campaignId,
      contactIds: selection.contactIds,
      leadIds: selection.leadIds,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't add recipients", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Recipients added" });
    setSelection({ contactIds: [], leadIds: [] });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add recipients"
      description="Pick existing contacts and leads to add to this campaign."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={onSave} loading={saving} disabled={count === 0}>
            Add {count > 0 ? count : ""}
          </Button>
        </>
      }
    >
      {contacts.length === 0 && leads.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-[var(--color-muted)]">
          Every contact and lead is already on this campaign.
        </p>
      ) : (
        <RecipientSelector
          contacts={contacts}
          leads={leads}
          value={selection}
          onChange={setSelection}
        />
      )}
    </Modal>
  );
}
