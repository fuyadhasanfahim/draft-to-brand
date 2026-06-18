"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  IconArchive,
  IconArchiveOff,
  IconBriefcase,
  IconDots,
  IconEdit,
  IconEye,
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
  Select,
  useToast,
} from "@/components/ui";
import { archiveClientAction } from "@/actions/clients";
import {
  ClientFormDialog,
  type ClientEditable,
  type ClientFormChoices,
} from "./client-form-dialog";

export type ClientRow = {
  id: string;
  companyId: string;
  ownerId: string | null;
  status: "ACTIVE" | "INACTIVE";
  onboardingStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startDate: Date | null;
  notes: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  company: { id: string; name: string };
  owner: { id: string; user: { name: string } } | null;
};

const STATUS_META: Record<
  ClientRow["status"],
  { label: string; variant: "success" | "neutral" }
> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "neutral" },
};

const ONBOARDING_META: Record<
  ClientRow["onboardingStatus"],
  { label: string; variant: "neutral" | "warning" | "success" }
> = {
  NOT_STARTED: { label: "Not started", variant: "neutral" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export function ClientsPageClient({
  clients,
  choices,
  canCreate,
  canEdit,
  canDelete,
}: {
  clients: ClientRow[];
  choices: ClientFormChoices;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ClientEditable | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<"" | ClientRow["status"]>("");
  const [ownerFilter, setOwnerFilter] = React.useState<string>("");

  const filtered = React.useMemo(
    () =>
      clients.filter((c) => {
        if (statusFilter && c.status !== statusFilter) return false;
        if (ownerFilter && c.ownerId !== ownerFilter) return false;
        return true;
      }),
    [clients, statusFilter, ownerFilter]
  );

  const columns: ColumnDef<ClientRow, unknown>[] = [
    {
      id: "company",
      accessorFn: (c) => c.company.name,
      header: "Company",
      cell: ({ row }) => {
        const c = row.original;
        const archived = Boolean(c.archivedAt);
        return (
          <div className={`flex items-center gap-3 min-w-[220px] ${archived ? "opacity-60" : ""}`}>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)] shrink-0">
              <IconBriefcase size={15} />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={`/dashboard/clients/${c.id}`}
                  className="font-medium text-[var(--color-foreground)] truncate hover:text-[var(--color-primary)] transition-colors"
                >
                  {c.company.name}
                </Link>
                {archived ? <Badge variant="neutral">Archived</Badge> : null}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "owner",
      accessorFn: (c) => c.owner?.user.name ?? "",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] truncate">
          {row.original.owner?.user.name ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (c) => c.status,
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_META[row.original.status].variant}>
          {STATUS_META[row.original.status].label}
        </Badge>
      ),
    },
    {
      id: "onboarding",
      accessorFn: (c) => c.onboardingStatus,
      header: "Onboarding",
      cell: ({ row }) => (
        <Badge variant={ONBOARDING_META[row.original.onboardingStatus].variant}>
          {ONBOARDING_META[row.original.onboardingStatus].label}
        </Badge>
      ),
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
      meta: { className: "hidden md:table-cell" },
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
                onSelect={() => router.push(`/dashboard/clients/${row.original.id}`)}
              >
                <IconEye size={14} /> View
              </DropdownItem>
              <>
                {canEdit ? (
                  <DropdownItem
                    onSelect={() =>
                      setEditing({
                        id: row.original.id,
                        companyId: row.original.companyId,
                        ownerId: row.original.ownerId,
                        status: row.original.status,
                        onboardingStatus: row.original.onboardingStatus,
                        startDate: row.original.startDate,
                        notes: row.original.notes,
                      })
                    }
                  >
                    <IconEdit size={14} /> Edit
                  </DropdownItem>
                ) : null}
                {canDelete ? (
                  <DropdownItem
                    onSelect={async () => {
                      const res = await archiveClientAction(row.original.id);
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
              </>
            </DropdownContent>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-9 text-xs"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="h-9 text-xs"
          >
            <option value="">All owners</option>
            {choices.owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        </div>
        {canCreate ? (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <IconPlus size={15} /> New client
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search clients…"
        empty={{
          title: "No clients yet",
          description: "Convert a won Lead or create a Client manually.",
        }}
      />

      {canCreate ? (
        <ClientFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          choices={choices}
        />
      ) : null}
      {editing ? (
        <ClientFormDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          client={editing}
          choices={choices}
        />
      ) : null}
    </>
  );
}
