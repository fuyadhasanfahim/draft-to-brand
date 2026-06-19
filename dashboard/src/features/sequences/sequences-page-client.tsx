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
  IconMailFast,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
} from "@tabler/icons-react";
import {
  Button,
  DataTable,
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
import {
  SequenceStatusBadge,
  sequenceState,
  type SequenceState,
} from "./sequence-badges";
import { SequenceFormDialog, type SequenceEditable } from "./sequence-form-dialog";

export type SequenceRow = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  stepCount: number;
  enrollmentCount: number;
};

export function SequencesPageClient({
  sequences,
  canCreate,
  canEdit,
  canDelete,
}: {
  sequences: SequenceRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<SequenceEditable | null>(null);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    const res = await fn();
    if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
    else router.refresh();
  };

  const columns: ColumnDef<SequenceRow, unknown>[] = [
    {
      id: "name",
      accessorFn: (s) => s.name,
      header: "Sequence",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex items-center gap-3 min-w-[220px]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)] shrink-0">
              <IconMailFast size={15} />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <Link
                href={`/dashboard/sequences/${s.id}`}
                className="font-medium text-[var(--color-foreground)] truncate hover:text-[var(--color-primary)] transition-colors"
              >
                {s.name}
              </Link>
              {s.description ? (
                <span className="text-[11px] text-[var(--color-muted)] truncate">{s.description}</span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      accessorFn: (s) => sequenceState(s),
      header: "Status",
      cell: ({ row }) => <SequenceStatusBadge state={sequenceState(row.original) as SequenceState} />,
    },
    {
      id: "steps",
      accessorFn: (s) => s.stepCount,
      header: "Steps",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums">
          {row.original.stepCount}
        </span>
      ),
    },
    {
      id: "enrollments",
      accessorFn: (s) => s.enrollmentCount,
      header: "Enrollments",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums">
          {row.original.enrollmentCount}
        </span>
      ),
      meta: { className: "hidden md:table-cell" },
    },
    {
      id: "createdAt",
      accessorFn: (s) => s.createdAt,
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
      cell: ({ row }) => {
        const s = row.original;
        const archived = Boolean(s.archivedAt);
        return (
          <div className="flex justify-end">
            <Dropdown>
              <DropdownTrigger>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <IconDots size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem onSelect={() => router.push(`/dashboard/sequences/${s.id}`)}>
                  <IconEye size={14} /> View
                </DropdownItem>
                {canEdit ? (
                  <>
                    <DropdownItem
                      onSelect={() =>
                        setEditing({ id: s.id, name: s.name, description: s.description })
                      }
                    >
                      <IconEdit size={14} /> Edit
                    </DropdownItem>
                    {!archived ? (
                      <DropdownItem
                        onSelect={() =>
                          run(() => setSequenceActiveAction({ id: s.id, isActive: !s.isActive }))
                        }
                      >
                        {s.isActive ? (
                          <>
                            <IconPlayerPause size={14} /> Pause
                          </>
                        ) : (
                          <>
                            <IconPlayerPlay size={14} /> Activate
                          </>
                        )}
                      </DropdownItem>
                    ) : null}
                  </>
                ) : null}
                {canDelete ? (
                  <DropdownItem onSelect={() => run(() => archiveSequenceAction(s.id))}>
                    {archived ? (
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
        );
      },
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        {canCreate ? (
          <Link
            href="/dashboard/sequences/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] px-3 text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <IconPlus size={15} /> New sequence
          </Link>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={sequences}
        searchPlaceholder="Search sequences…"
        empty={{
          title: "No sequences yet",
          description: "Create a followup sequence, add steps, then attach it to a campaign.",
        }}
      />

      {editing ? (
        <SequenceFormDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          sequence={editing}
        />
      ) : null}
    </>
  );
}
