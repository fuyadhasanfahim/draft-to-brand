"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconEdit,
  IconEye,
  IconMailForward,
  IconPlus,
} from "@tabler/icons-react";
import {
  Badge,
  Button,
  DataTable,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  useToast,
} from "@/components/ui";
import { archiveCampaignAction } from "@/actions/campaigns";
import {
  CampaignStatusBadge,
  type CampaignStatus,
} from "./campaign-badges";
import { formatRate } from "./analytics";
import {
  CampaignFormDialog,
  type CampaignEditable,
} from "./campaign-form-dialog";

export type CampaignRow = {
  id: string;
  name: string;
  subject: string;
  body: string;
  fromName: string | null;
  replyTo: string | null;
  status: CampaignStatus;
  archivedAt: Date | null;
  createdAt: Date;
  createdByName: string | null;
  recipients: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
};

export function CampaignsPageClient({
  campaigns,
  canCreate,
  canEdit,
  canDelete,
}: {
  campaigns: CampaignRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<CampaignEditable | null>(null);

  const columns: ColumnDef<CampaignRow, unknown>[] = [
    {
      id: "name",
      accessorFn: (c) => c.name,
      header: "Campaign",
      cell: ({ row }) => {
        const c = row.original;
        const archived = Boolean(c.archivedAt);
        return (
          <div className={`flex items-center gap-3 min-w-[220px] ${archived ? "opacity-60" : ""}`}>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)] shrink-0">
              <IconMailForward size={15} />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={`/dashboard/campaigns/${c.id}`}
                  className="font-medium text-[var(--color-foreground)] truncate hover:text-[var(--color-primary)] transition-colors"
                >
                  {c.name}
                </Link>
                {archived ? <Badge variant="neutral">Archived</Badge> : null}
              </span>
              <span className="text-[11px] text-[var(--color-muted)] truncate">{c.subject}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      accessorFn: (c) => c.status,
      header: "Status",
      cell: ({ row }) => <CampaignStatusBadge status={row.original.status} />,
    },
    {
      id: "recipients",
      accessorFn: (c) => c.recipients,
      header: "Recipients",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums">
          {row.original.recipients}
        </span>
      ),
    },
    {
      id: "openRate",
      accessorFn: (c) => c.openRate,
      header: "Open rate",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums">
          {formatRate(row.original.openRate)}
        </span>
      ),
    },
    {
      id: "clickRate",
      accessorFn: (c) => c.clickRate,
      header: "Click rate",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums">
          {formatRate(row.original.clickRate)}
        </span>
      ),
    },
    {
      id: "bounceRate",
      accessorFn: (c) => c.bounceRate,
      header: "Bounce rate",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums">
          {formatRate(row.original.bounceRate)}
        </span>
      ),
      meta: { className: "hidden md:table-cell" },
    },
    {
      id: "createdBy",
      accessorFn: (c) => c.createdByName ?? "",
      header: "Created by",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] truncate">
          {row.original.createdByName ?? "—"}
        </span>
      ),
      meta: { className: "hidden md:table-cell" },
    },
    {
      id: "createdAt",
      accessorFn: (c) => c.createdAt,
      header: "Created",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] whitespace-nowrap">
          {format(row.original.createdAt, "MMM d, yyyy")}
        </span>
      ),
      meta: { className: "hidden lg:table-cell" },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                <IconDots size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem
                onSelect={() => router.push(`/dashboard/campaigns/${row.original.id}`)}
              >
                <IconEye size={14} /> View
              </DropdownItem>
              {canEdit ? (
                <DropdownItem
                  onSelect={() =>
                    setEditing({
                      id: row.original.id,
                      name: row.original.name,
                      subject: row.original.subject,
                      body: row.original.body,
                      fromName: row.original.fromName,
                      replyTo: row.original.replyTo,
                    })
                  }
                >
                  <IconEdit size={14} /> Edit
                </DropdownItem>
              ) : null}
              {canDelete ? (
                <DropdownItem
                  onSelect={async () => {
                    const res = await archiveCampaignAction(row.original.id);
                    if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
                    else router.refresh();
                  }}
                >
                  {row.original.archivedAt ? (
                    <>
                      <IconArchiveOff size={14} /> Restore
                    </>
                  ) : (
                    <>
                      <IconArchive size={14} /> Archive
                    </>
                  )}
                </DropdownItem>
              ) : null}
            </DropdownContent>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        {canCreate ? (
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <IconPlus size={15} /> New campaign
          </Link>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={campaigns}
        searchPlaceholder="Search campaigns…"
        empty={{
          title: "No campaigns yet",
          description: "Create a cold email campaign to start reaching out.",
        }}
      />

      {editing ? (
        <CampaignFormDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          campaign={editing}
        />
      ) : null}
    </>
  );
}
