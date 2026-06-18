"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconEdit,
  IconPlayerPause,
  IconPlayerPlay,
  IconCircleCheck,
  IconSend,
} from "@tabler/icons-react";
import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  useToast,
} from "@/components/ui";
import {
  archiveCampaignAction,
  setCampaignStatusAction,
  sendCampaignAction,
} from "@/actions/campaigns";
import {
  CampaignFormDialog,
  type CampaignEditable,
} from "./campaign-form-dialog";
import type { CampaignStatus } from "./campaign-badges";

export function CampaignDetailActions({
  campaign,
  status,
  isArchived,
  recipientCount,
  canEdit,
  canDelete,
}: {
  campaign: CampaignEditable;
  status: CampaignStatus;
  isArchived: boolean;
  recipientCount: number;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const setStatus = async (next: CampaignStatus) => {
    setBusy(true);
    const res = await setCampaignStatusAction({ id: campaign.id, status: next });
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Action failed", description: res.error });
      return;
    }
    router.refresh();
  };

  const send = async () => {
    setBusy(true);
    const res = await sendCampaignAction({ campaignId: campaign.id });
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't send", description: res.error });
      return;
    }
    toast({
      variant: "success",
      title: `Campaign sent to ${res.sent} recipient${res.sent === 1 ? "" : "s"}`,
      description: res.failed > 0 ? `${res.failed} failed and were left pending.` : undefined,
    });
    router.refresh();
  };

  // Send is the primary action for a DRAFT campaign that has recipients.
  const canSend = !isArchived && canEdit && status === "DRAFT" && recipientCount > 0;

  // Contextual lifecycle controls. Hidden once archived (restore first).
  const lifecycle = !isArchived && canEdit ? (
    <>
      {status === "PAUSED" ? (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => setStatus("RUNNING")}>
          <IconPlayerPlay size={14} /> Resume
        </Button>
      ) : null}
      {status === "RUNNING" ? (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => setStatus("PAUSED")}>
          <IconPlayerPause size={14} /> Pause
        </Button>
      ) : null}
      {status === "RUNNING" || status === "PAUSED" ? (
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => setStatus("COMPLETED")}>
          <IconCircleCheck size={14} /> Complete
        </Button>
      ) : null}
    </>
  ) : null;

  return (
    <>
      <div className="flex items-center gap-2">
        {canSend ? (
          <Button variant="accent" disabled={busy} loading={busy} onClick={send}>
            <IconSend size={14} /> Send campaign
          </Button>
        ) : null}
        {lifecycle}
        {canEdit ? (
          <Button variant="primary" onClick={() => setEditOpen(true)}>
            <IconEdit size={14} /> Edit
          </Button>
        ) : null}
        {canDelete ? (
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="icon-sm" aria-label="More">
                <IconDots size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem
                onSelect={async () => {
                  const res = await archiveCampaignAction(campaign.id);
                  if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
                  else router.refresh();
                }}
              >
                {isArchived ? (
                  <>
                    <IconArchiveOff size={14} /> Restore
                  </>
                ) : (
                  <>
                    <IconArchive size={14} /> Archive
                  </>
                )}
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        ) : null}
      </div>

      {canEdit ? (
        <CampaignFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          campaign={campaign}
        />
      ) : null}
    </>
  );
}
