"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { IconDots, IconPlus, IconTrash } from "@tabler/icons-react";
import {
  Button,
  DataTable,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  useToast,
} from "@/components/ui";
import { removeRecipientAction } from "@/actions/campaigns";
import {
  RecipientStatusBadge,
  type RecipientStatus,
} from "./campaign-badges";
import { AddRecipientsDialog } from "./add-recipients-dialog";
import type { ContactOption, LeadOption } from "./recipient-selector";

export type CampaignRecipientRow = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: RecipientStatus;
  source: "contact" | "lead" | "manual";
  sentAt: Date | null;
  createdAt: Date;
};

export function CampaignRecipientsTable({
  campaignId,
  recipients,
  availableContacts,
  availableLeads,
  canEdit,
}: {
  campaignId: string;
  recipients: CampaignRecipientRow[];
  availableContacts: ContactOption[];
  availableLeads: LeadOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = React.useState(false);

  const fullName = (r: CampaignRecipientRow) =>
    [r.firstName, r.lastName].filter(Boolean).join(" ").trim();

  const columns: ColumnDef<CampaignRecipientRow, unknown>[] = [
    {
      id: "name",
      accessorFn: (r) => fullName(r) || r.email,
      header: "Recipient",
      cell: ({ row }) => {
        const r = row.original;
        const name = fullName(r);
        return (
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-medium text-[var(--color-foreground)] truncate">
              {name || r.email || "—"}
            </span>
            {name ? (
              <span className="text-[11px] text-[var(--color-muted)] truncate">
                {r.email || "No email"}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "source",
      accessorFn: (r) => r.source,
      header: "Source",
      cell: ({ row }) => (
        <span className="text-[12px] capitalize text-[var(--color-muted-foreground)]">
          {row.original.source}
        </span>
      ),
      meta: { className: "hidden md:table-cell" },
    },
    {
      id: "status",
      accessorFn: (r) => r.status,
      header: "Status",
      cell: ({ row }) => <RecipientStatusBadge status={row.original.status} />,
    },
    {
      id: "sentAt",
      accessorFn: (r) => r.sentAt?.getTime() ?? 0,
      header: "Sent",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] whitespace-nowrap">
          {row.original.sentAt ? format(row.original.sentAt, "MMM d, yyyy") : "—"}
        </span>
      ),
      meta: { className: "hidden lg:table-cell" },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canEdit ? (
          <div className="flex justify-end">
            <Dropdown>
              <DropdownTrigger>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <IconDots size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem
                  destructive
                  onSelect={async () => {
                    const res = await removeRecipientAction({ recipientId: row.original.id });
                    if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
                    else router.refresh();
                  }}
                >
                  <IconTrash size={14} /> Remove
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {canEdit ? (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            <IconPlus size={14} /> Add recipients
          </Button>
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={recipients}
        searchPlaceholder="Search recipients…"
        empty={{
          title: "No recipients yet",
          description: canEdit ? "Add contacts or leads to this campaign." : undefined,
        }}
      />

      {canEdit ? (
        <AddRecipientsDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          campaignId={campaignId}
          contacts={availableContacts}
          leads={availableLeads}
        />
      ) : null}
    </div>
  );
}
