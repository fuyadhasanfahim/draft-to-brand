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
  IconPlus,
  IconTargetArrow,
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
import { archiveLeadAction } from "@/actions/leads";
import {
  LeadFormDialog,
  type LeadEditable,
  type LeadFormChoices,
} from "./lead-form-dialog";
import type { LeadFormValues } from "@/lib/validators/leads";

export type LeadRow = {
  id: string;
  title: string;
  status: "OPEN" | "WON" | "LOST";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedValue: string | null; // serialized Decimal
  currency: LeadFormValues["currency"];
  expectedCloseDate: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  companyId: string | null;
  contactId: string | null;
  leadSourceId: string | null;
  ownerId: string | null;
  pipelineId: string;
  stageId: string;
  description: string | null;
  company: { id: string; name: string } | null;
  contact: { id: string; firstName: string; lastName: string } | null;
  leadSource: { id: string; name: string; color: string } | null;
  owner: { id: string; user: { name: string } } | null;
  pipeline: { id: string; name: string };
  stage: { id: string; name: string; color: string };
};

const STATUS_META: Record<LeadRow["status"], { label: string; variant: "success" | "warning" | "neutral" | "danger" }> = {
  OPEN: { label: "Open",  variant: "warning" },
  WON:  { label: "Won",   variant: "success" },
  LOST: { label: "Lost",  variant: "danger" },
};

const PRIORITY_META: Record<LeadRow["priority"], { label: string; variant: "neutral" | "warning" | "danger" | "success" }> = {
  LOW:    { label: "Low",    variant: "neutral" },
  MEDIUM: { label: "Medium", variant: "neutral" },
  HIGH:   { label: "High",   variant: "warning" },
  URGENT: { label: "Urgent", variant: "danger" },
};

export function LeadsPageClient({
  leads,
  choices,
  canCreate,
  canEdit,
  canDelete,
  defaultPipelineId,
}: {
  leads: LeadRow[];
  choices: LeadFormChoices;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  defaultPipelineId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<LeadEditable | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<"" | LeadRow["status"]>("");
  const [priorityFilter, setPriorityFilter] = React.useState<"" | LeadRow["priority"]>("");
  const [ownerFilter, setOwnerFilter] = React.useState<string>("");
  const [pipelineFilter, setPipelineFilter] = React.useState<string>("");
  const [stageFilter, setStageFilter] = React.useState<string>("");

  const stagesForFilter = React.useMemo(() => {
    if (!pipelineFilter) return [];
    return choices.pipelines.find((p) => p.id === pipelineFilter)?.stages ?? [];
  }, [choices.pipelines, pipelineFilter]);

  React.useEffect(() => {
    // Reset stage filter when pipeline changes
    if (stageFilter && !stagesForFilter.some((s) => s.id === stageFilter)) {
      setStageFilter("");
    }
  }, [pipelineFilter, stageFilter, stagesForFilter]);

  const filtered = React.useMemo(
    () =>
      leads.filter((l) => {
        if (statusFilter && l.status !== statusFilter) return false;
        if (priorityFilter && l.priority !== priorityFilter) return false;
        if (ownerFilter && l.ownerId !== ownerFilter) return false;
        if (pipelineFilter && l.pipelineId !== pipelineFilter) return false;
        if (stageFilter && l.stageId !== stageFilter) return false;
        return true;
      }),
    [leads, statusFilter, priorityFilter, ownerFilter, pipelineFilter, stageFilter]
  );

  const formatMoney = (value: string | null, currency: string | null) => {
    if (!value) return null;
    const n = Number(value);
    if (Number.isNaN(n)) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency ?? "USD",
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `${n.toLocaleString()} ${currency ?? ""}`.trim();
    }
  };

  const columns: ColumnDef<LeadRow, unknown>[] = [
    {
      id: "title",
      accessorFn: (l) => l.title,
      header: "Lead",
      cell: ({ row }) => {
        const l = row.original;
        return (
          <div className="flex items-center gap-3 min-w-[220px]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)] shrink-0">
              <IconTargetArrow size={15} />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <Link
                href={`/dashboard/leads/${l.id}`}
                className="font-medium text-[var(--color-foreground)] truncate hover:text-[var(--color-primary)] transition-colors"
              >
                {l.title}
              </Link>
              {l.company?.name ? (
                <span className="text-[11px] text-[var(--color-muted)] truncate">
                  {l.company.name}
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "stage",
      accessorFn: (l) => `${l.pipeline.name} · ${l.stage.name}`,
      header: "Stage",
      cell: ({ row }) => (
        <div className="flex flex-col leading-tight">
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-foreground)]"
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: row.original.stage.color }}
            />
            {row.original.stage.name}
          </span>
          <span className="text-[11px] text-[var(--color-muted)] truncate">
            {row.original.pipeline.name}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      accessorFn: (l) => l.status,
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS_META[row.original.status].variant}>
          {STATUS_META[row.original.status].label}
        </Badge>
      ),
    },
    {
      id: "priority",
      accessorFn: (l) => l.priority,
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant={PRIORITY_META[row.original.priority].variant}>
          {PRIORITY_META[row.original.priority].label}
        </Badge>
      ),
    },
    {
      id: "value",
      accessorFn: (l) => Number(l.estimatedValue ?? 0),
      header: "Value",
      cell: ({ row }) => {
        const money = formatMoney(
          row.original.estimatedValue,
          row.original.currency ?? null
        );
        return (
          <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums whitespace-nowrap">
            {money ?? "—"}
          </span>
        );
      },
    },
    {
      id: "owner",
      accessorFn: (l) => l.owner?.user.name ?? "",
      header: "Owner",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] truncate">
          {row.original.owner?.user.name ?? "—"}
        </span>
      ),
    },
    {
      id: "expectedCloseDate",
      accessorFn: (l) => l.expectedCloseDate?.getTime() ?? 0,
      header: "Close",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] whitespace-nowrap">
          {row.original.expectedCloseDate
            ? format(row.original.expectedCloseDate, "MMM d, yyyy")
            : "—"}
        </span>
      ),
      meta: { className: "hidden md:table-cell" },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canEdit || canDelete ? (
          <div className="flex justify-end">
            <Dropdown>
              <DropdownTrigger>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <IconDots size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                {canEdit ? (
                  <DropdownItem
                    onSelect={() =>
                      setEditing({
                        id: row.original.id,
                        title: row.original.title,
                        companyId: row.original.companyId,
                        contactId: row.original.contactId,
                        leadSourceId: row.original.leadSourceId,
                        ownerId: row.original.ownerId,
                        pipelineId: row.original.pipelineId,
                        stageId: row.original.stageId,
                        status: row.original.status,
                        priority: row.original.priority,
                        estimatedValue: row.original.estimatedValue
                          ? Number(row.original.estimatedValue)
                          : null,
                        currency: row.original.currency,
                        expectedCloseDate: row.original.expectedCloseDate,
                        description: row.original.description,
                      })
                    }
                  >
                    <IconEdit size={14} /> Edit
                  </DropdownItem>
                ) : null}
                {canDelete ? (
                  <DropdownItem
                    onSelect={async () => {
                      const res = await archiveLeadAction(row.original.id);
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
        ) : null,
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
            <option value="OPEN">Open</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="h-9 text-xs"
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
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
          <Select
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
            className="h-9 text-xs"
          >
            <option value="">All pipelines</option>
            {choices.pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9 text-xs"
            disabled={!pipelineFilter}
          >
            <option value="">All stages</option>
            {stagesForFilter.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        {canCreate ? (
          <Link
            href="/dashboard/leads/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <IconPlus size={15} /> New lead
          </Link>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search leads…"
        empty={{ title: "No leads yet" }}
      />

      {editing ? (
        <LeadFormDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          lead={editing}
          choices={choices}
        />
      ) : null}
    </>
  );
}
