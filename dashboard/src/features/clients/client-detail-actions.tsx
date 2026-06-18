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
import { archiveClientAction } from "@/actions/clients";
import {
  ClientFormDialog,
  type ClientEditable,
  type ClientFormChoices,
} from "./client-form-dialog";

export function ClientDetailActions({
  client,
  choices,
  canEdit,
  canDelete,
  isArchived,
}: {
  client: ClientEditable;
  choices: ClientFormChoices;
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
                  const res = await archiveClientAction(client.id);
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
        <ClientFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          client={client}
          choices={choices}
        />
      ) : null}
    </>
  );
}
