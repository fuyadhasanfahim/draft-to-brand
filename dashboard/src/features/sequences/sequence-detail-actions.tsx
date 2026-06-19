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
  archiveSequenceAction,
  setSequenceActiveAction,
} from "@/actions/sequences";
import { SequenceFormDialog, type SequenceEditable } from "./sequence-form-dialog";

export function SequenceDetailActions({
  sequence,
  isActive,
  isArchived,
  canEdit,
  canDelete,
}: {
  sequence: SequenceEditable;
  isActive: boolean;
  isArchived: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
    else router.refresh();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && !isArchived ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => run(() => setSequenceActiveAction({ id: sequence.id, isActive: !isActive }))}
          >
            {isActive ? (
              <>
                <IconPlayerPause size={14} /> Pause
              </>
            ) : (
              <>
                <IconPlayerPlay size={14} /> Activate
              </>
            )}
          </Button>
        ) : null}
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
              <DropdownItem onSelect={() => run(() => archiveSequenceAction(sequence.id))}>
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
        <SequenceFormDialog open={editOpen} onOpenChange={setEditOpen} sequence={sequence} />
      ) : null}
    </>
  );
}
