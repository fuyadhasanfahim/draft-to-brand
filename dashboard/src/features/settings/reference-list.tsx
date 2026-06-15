"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconEdit,
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

/**
 * Generic settings-list shell. The page passes:
 *
 *   - rows
 *   - extra display columns
 *   - on-edit handler (opens the appropriate dialog)
 *   - archive action
 *   - new-button trigger
 *
 * Keeps Industries / CompanySizes / LeadSources visually consistent without
 * duplicating the table + actions ceremony three times.
 */

export type ReferenceRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  archivedAt: Date | null;
};

export function ReferenceList<T extends ReferenceRow>({
  rows,
  extraColumns,
  onEdit,
  onArchive,
  canManage,
  onCreate,
  searchPlaceholder,
  emptyTitle,
}: {
  rows: T[];
  extraColumns?: ColumnDef<T, unknown>[];
  onEdit: (row: T) => void;
  onArchive: (id: string) => Promise<{ ok: boolean; error?: string }>;
  canManage: boolean;
  onCreate: () => void;
  searchPlaceholder: string;
  emptyTitle: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const columns: ColumnDef<T, unknown>[] = [
    {
      id: "name",
      accessorFn: (r) => r.name,
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-foreground)]">{row.original.name}</span>
          {row.original.archivedAt ? (
            <Badge variant="neutral">Archived</Badge>
          ) : !row.original.isActive ? (
            <Badge variant="warning">Inactive</Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: "slug",
      accessorFn: (r) => r.slug,
      header: "Slug",
      cell: ({ row }) => (
        <code className="text-xs text-[var(--color-muted-foreground)]">{row.original.slug}</code>
      ),
    },
    ...(extraColumns ?? []),
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canManage ? (
          <div className="flex justify-end">
            <Dropdown>
              <DropdownTrigger>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <IconDots size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem onSelect={() => onEdit(row.original)}>
                  <IconEdit size={14} /> Edit
                </DropdownItem>
                <DropdownItem
                  onSelect={async () => {
                    const res = await onArchive(row.original.id);
                    if (!res.ok) {
                      toast({
                        variant: "error",
                        title: "Action failed",
                        description: res.error,
                      });
                      return;
                    }
                    router.refresh();
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
              </DropdownContent>
            </Dropdown>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        {canManage ? (
          <Button variant="accent" onClick={onCreate}>
            <IconPlus size={15} /> New
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder={searchPlaceholder}
        empty={{ title: emptyTitle }}
      />
    </>
  );
}
