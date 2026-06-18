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
} from "@tabler/icons-react";
import type { Contact } from "@prisma/client";
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  useToast,
} from "@/components/ui";
import { archiveContactAction } from "@/actions/contacts";
import {
  ContactFormDialog,
  type CompanyChoice,
  type ContactEditable,
} from "./contact-form-dialog";
import type { TagOption } from "./tag-selector";
import { TagChip } from "./tag-chip";

export type ContactRow = Contact & {
  company: { id: string; name: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
};

const STATUS: Record<ContactRow["status"], { label: string; variant: "success" | "neutral" }> = {
  ACTIVE:   { label: "Active",   variant: "success" },
  ARCHIVED: { label: "Archived", variant: "neutral" },
};

export function ContactsPageClient({
  contacts,
  companies,
  tags,
  canManage,
  canManageTags,
}: {
  contacts: ContactRow[];
  companies: CompanyChoice[];
  tags: TagOption[];
  canManage: boolean;
  canManageTags: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ContactEditable | null>(null);

  const columns: ColumnDef<ContactRow, unknown>[] = [
    {
      id: "name",
      accessorFn: (c) => `${c.firstName} ${c.lastName}`,
      header: "Name",
      cell: ({ row }) => {
        const c = row.original;
        const fullName = `${c.firstName} ${c.lastName}`;
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <Avatar name={fullName} size="sm" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-medium text-[var(--color-foreground)] truncate">{fullName}</span>
              {c.jobTitle ? (
                <span className="text-[11px] text-[var(--color-muted)] truncate">{c.jobTitle}</span>
              ) : null}
              {c.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {c.tags.slice(0, 3).map(({ tag }) => (
                    <TagChip key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                  {c.tags.length > 3 ? (
                    <span className="text-[10px] text-[var(--color-muted)]">
                      +{c.tags.length - 3}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      id: "company",
      accessorFn: (c) => c.company?.name ?? "",
      header: "Company",
      cell: ({ row }) => {
        const c = row.original.company;
        if (!c) return <span className="text-[var(--color-muted)] text-xs">—</span>;
        return (
          <Link
            href={`/dashboard/companies/${c.id}`}
            className="text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            {c.name}
          </Link>
        );
      },
    },
    {
      id: "email",
      accessorFn: (c) => c.email ?? "",
      header: "Email",
      cell: ({ row }) =>
        row.original.email ? (
          <a
            href={`mailto:${row.original.email}`}
            className="text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            {row.original.email}
          </a>
        ) : (
          <span className="text-[var(--color-muted)] text-xs">—</span>
        ),
    },
    {
      id: "phone",
      accessorFn: (c) => c.phone ?? "",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-[12px] text-[var(--color-muted-foreground)] tabular-nums">
          {row.original.phone ?? "—"}
        </span>
      ),
      meta: { className: "hidden md:table-cell" },
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
                {/* TODO: Add a "View" action once a Contact detail page
                    (/dashboard/contacts/[id]) exists. Skipped for now —
                    contacts have no dedicated detail route. */}
                <DropdownItem
                  onSelect={() =>
                    setEditing({
                      id: row.original.id,
                      firstName: row.original.firstName,
                      lastName: row.original.lastName,
                      email: row.original.email,
                      phone: row.original.phone,
                      jobTitle: row.original.jobTitle,
                      linkedinUrl: row.original.linkedinUrl,
                      notes: row.original.notes,
                      status: row.original.status,
                      companyId: row.original.companyId,
                      tagIds: row.original.tags.map((t) => t.tag.id),
                    })
                  }
                >
                  <IconEdit size={14} /> Edit
                </DropdownItem>
                <DropdownItem
                  onSelect={async () => {
                    const res = await archiveContactAction(row.original.id);
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
            <IconPlus size={15} /> New contact
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={contacts}
        searchPlaceholder="Search contacts…"
        empty={{ title: "No contacts yet" }}
      />

      {canManage ? (
        <>
          <ContactFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            companies={companies}
            tags={tags}
            canManageTags={canManageTags}
          />
          {editing ? (
            <ContactFormDialog
              open={!!editing}
              onOpenChange={(v) => !v && setEditing(null)}
              contact={editing}
              companies={companies}
              tags={tags}
              canManageTags={canManageTags}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
