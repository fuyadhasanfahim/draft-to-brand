"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconBriefcase } from "@tabler/icons-react";
import { Button, Modal, useToast } from "@/components/ui";
import { convertLeadToClientAction } from "@/actions/clients";

/**
 * "Convert to Client" CTA — shown on Lead detail when the Lead is WON and
 * hasn't been converted yet. Opens a small confirmation modal so reps don't
 * convert by accident. On success we navigate to the new Client.
 */
export function ConvertLeadButton({
  leadId,
  leadTitle,
  companyName,
}: {
  leadId: string;
  leadTitle: string;
  companyName: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const onConvert = () => {
    startTransition(async () => {
      const res = await convertLeadToClientAction({ leadId });
      if (!res.ok) {
        toast({ variant: "error", title: "Couldn't convert", description: res.error });
        return;
      }
      toast({ variant: "success", title: "Lead converted to client" });
      setOpen(false);
      if (res.id) router.push(`/dashboard/clients/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}>
        <IconBriefcase size={14} /> Convert to Client
      </Button>
      <Modal
        open={open}
        onOpenChange={(v) => !pending && setOpen(v)}
        title="Convert this Lead to a Client?"
        description="A Client represents an ongoing engagement. Future modules (Projects, Invoices) will attach to the new Client record."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onConvert} loading={pending}>
              Convert
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--color-muted-foreground)]">
          Lead: <span className="font-medium text-[var(--color-foreground)]">{leadTitle}</span>
          {companyName ? (
            <>
              {" "}
              · Company:{" "}
              <span className="font-medium text-[var(--color-foreground)]">{companyName}</span>
            </>
          ) : null}
        </p>
      </Modal>
    </>
  );
}
