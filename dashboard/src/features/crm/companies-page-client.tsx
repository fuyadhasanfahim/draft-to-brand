"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  IconArchive,
  IconArchiveOff,
  IconBuilding,
  IconDots,
  IconEdit,
  IconExternalLink,
  IconPlus,
} from "@tabler/icons-react";
import type { Company } from "@prisma/client";
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
import { archiveCompanyAction } from "@/actions/companies";
import { CompanyFormDialog, type CompanyEditable } from "./company-form-dialog";
import type { TagOption } from "./tag-selector";

export type CompanyRow = Company & {
  _count: { contacts: number };
  tags: { tag: { id: string; name: string; color: string } }[];
};

const STATUS: Record<CompanyRow["status"], { label: string; variant: "success" | "warning" | "neutral" }> = {
  ACTIVE:   { label: "Active",   variant: "success" },
  PROSPECT: { label: "Prospect", variant: "warning" },
  ARCHIVED: { label: "Archived", variant: "neutral" },
};

export function CompaniesPageClient({
  companies,
  tags,
  tagsById,
  canManage,
  canManageTags,
}: {
  companies: CompanyRow[];
  tags: TagOption[];
  tagsById: Record<string, TagOption>;
  canManage: boolean;
  canManageTags: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CompanyEditable | null>(null);
  void tagsById;

  const columns: ColumnDef<CompanyRow, unknown>[] = [
    {
      id: "name",
      accessorFn: (c) => c.name,
      header: "Company",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex items-center gap-3 min-w-[220px]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)] shrink-0">
              <IconBuilding size={15} />
            </span>
            <div className="flex flex-col leading-tight min-w-0">
              <Link
                href={`/dashboard/companies/${c.id}`}
                className="font-medium text-[var(--color-foreground)] truncate hover:text-[var(--color-primary)] transition-colors"
              >
                {c.name}
              </Link>
              {c.industry ? (
                <span className="text-[11px] text-[var(--color-muted)] truncate">
                  {c.industry}
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "website",
      accessorFn: (c) => c.website ?? "",
      header: "Website",
      cell: ({ row }) => {
        const w = row.original.website;
        if (!w) return <span className="text-[var(--color-muted)] text-xs">—</span>;
        return (
          <a
            href={w}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors truncate max-w-[220px]"
          >
            <span className="truncate">{w.replace(/^https?:\/\//, "")}</span>
            <IconExternalLink size={11} className="shrink-0" />
          </a>
        );
      },
    },
    {
      id: "status",
      accessorFn: (c) => c.status,
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={STATUS[row.original.status].variant}>
          {STATUS[row.original.status].label}
        </Badge>
      ),
    },
    {
      id: "contacts",
      accessorFn: (c) => c._count.contacts,
      header: "Contacts",
      cell: ({ row }) => (
        <span className="text-[var(--color-muted-foreground)] text-[12px] tabular-nums">
          {row.original._count.contacts}
        </span>
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
                <DropdownItem
                  onSelect={() =>
                    setEditing({
                      id: row.original.id,
                      name: row.original.name,
                      slug: row.original.slug,
                      website: row.original.website,
                      industry: row.original.industry,
                      description: row.original.description,
                      status: row.original.status,
                      size: row.original.size,
                      country: row.original.country,
                      city: row.original.city,
                      address: row.original.address,
                      phone: row.original.phone,
                      email: row.original.email,
                      tagIds: row.original.tags.map((t) => t.tag.id),
                    })
                  }
                >
                  <IconEdit size={14} /> Edit
                </DropdownItem>
                <DropdownItem
                  onSelect={async () => {
                    const res = await archiveCompanyAction(row.original.id);
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
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <IconPlus size={15} /> New company
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={companies}
        searchPlaceholder="Search companies…"
        empty={{ title: "No companies yet" }}
      />

      {canManage ? (
        <>
          <CompanyFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            tags={tags}
            canManageTags={canManageTags}
          />
          {editing ? (
            <CompanyFormDialog
              open={!!editing}
              onOpenChange={(v) => !v && setEditing(null)}
              company={editing}
              tags={tags}
              canManageTags={canManageTags}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
