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
  IconEye,
  IconPlus,
} from "@tabler/icons-react";
import type { Company, Country, CompanySize, Industry, LeadSource } from "@prisma/client";
import { isSafeUrl } from "@/lib/safe-url";
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
import {
  CompanyFormDialog,
  type CompanyEditable,
  type IndustryChoice,
  type CountryChoice,
  type CompanySizeChoice,
  type LeadSourceChoice,
  type MemberChoice,
} from "./company-form-dialog";
import type { TagOption } from "./tag-selector";
import { TagChip } from "./tag-chip";

export type CompanyRow = Company & {
  _count: { contacts: number };
  tags: { tag: { id: string; name: string; color: string } }[];
  industry: Pick<Industry, "id" | "name"> | null;
  country: Pick<Country, "id" | "name" | "iso2"> | null;
  companySize: Pick<CompanySize, "id" | "name"> | null;
  leadSource: Pick<LeadSource, "id" | "name" | "color"> | null;
};

const STATUS: Record<CompanyRow["status"], { label: string; variant: "success" | "warning" | "neutral" }> = {
  ACTIVE:   { label: "Active",   variant: "success" },
  PROSPECT: { label: "Prospect", variant: "warning" },
  ARCHIVED: { label: "Archived", variant: "neutral" },
};

export function CompaniesPageClient({
  companies,
  tags,
  canManage,
  canManageTags,
  industries,
  countries,
  companySizes,
  leadSources,
  owners,
}: {
  companies: CompanyRow[];
  tags: TagOption[];
  canManage: boolean;
  canManageTags: boolean;
  industries: IndustryChoice[];
  countries: CountryChoice[];
  companySizes: CompanySizeChoice[];
  leadSources: LeadSourceChoice[];
  owners: MemberChoice[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CompanyEditable | null>(null);

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
              {c.industry?.name ? (
                <span className="text-[11px] text-[var(--color-muted)] truncate">
                  {c.industry.name}
                </span>
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
      id: "website",
      accessorFn: (c) => c.website ?? "",
      header: "Website",
      cell: ({ row }) => {
        const href = isSafeUrl(row.original.website);
        if (!href) return <span className="text-[var(--color-muted)] text-xs">—</span>;
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors truncate max-w-[220px]"
          >
            <span className="truncate">{href.replace(/^https?:\/\//, "")}</span>
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
                onSelect={() => router.push(`/dashboard/companies/${row.original.id}`)}
              >
                <IconEye size={14} /> View
              </DropdownItem>
              {canManage ? (
                <>
                <DropdownItem
                  onSelect={() =>
                    setEditing({
                      id: row.original.id,
                      name: row.original.name,
                      slug: row.original.slug,
                      website: row.original.website,
                      description: row.original.description,
                      status: row.original.status,
                      industryId: row.original.industryId,
                      countryId: row.original.countryId,
                      companySizeId: row.original.companySizeId,
                      leadSourceId: row.original.leadSourceId,
                      ownerId: row.original.ownerId,
                      primaryContactId: row.original.primaryContactId,
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
                </>
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
            industries={industries}
            countries={countries}
            companySizes={companySizes}
            leadSources={leadSources}
            owners={owners}
          />
          {editing ? (
            <CompanyFormDialog
              open={!!editing}
              onOpenChange={(v) => !v && setEditing(null)}
              company={editing}
              tags={tags}
              canManageTags={canManageTags}
              industries={industries}
              countries={countries}
              companySizes={companySizes}
              leadSources={leadSources}
              owners={owners}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
}
