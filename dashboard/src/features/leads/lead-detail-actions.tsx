"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconEdit,
} from "@tabler/icons-react";
import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  useToast,
} from "@/components/ui";
import { archiveLeadAction } from "@/actions/leads";
import {
  LeadFormDialog,
  type LeadEditable,
  type LeadFormChoices,
} from "./lead-form-dialog";

export function LeadDetailActions({
  lead,
  choices,
  canEdit,
  canDelete,
  isArchived,
}: {
  lead: LeadEditable;
  choices: LeadFormChoices;
  canEdit: boolean;
  canDelete: boolean;
  isArchived: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
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
                  const res = await archiveLeadAction(lead.id);
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
        <LeadFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          lead={lead}
          choices={choices}
        />
      ) : null}
    </>
  );
}
