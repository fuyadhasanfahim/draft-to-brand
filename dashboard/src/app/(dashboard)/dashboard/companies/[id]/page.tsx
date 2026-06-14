import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { IconChevronLeft, IconClockHour3 } from "@tabler/icons-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { Badge, EmptyState, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { CompanyOverview } from "@/features/crm/company-overview";
import { CompanyDetailActions } from "@/features/crm/company-detail-actions";
import { NotesSection } from "@/features/crm/notes-section";
import { TagChip } from "@/features/crm/tag-chip";
import { CompanyContactsTab } from "@/features/crm/company-contacts-tab";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "neutral" }> = {
  ACTIVE:   { label: "Active",   variant: "success" },
  PROSPECT: { label: "Prospect", variant: "warning" },
  ARCHIVED: { label: "Archived", variant: "neutral" },
};

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!(await can("companies.view"))) notFound();
  const orgId = session.member.organizationId;

  const company = await prisma.company.findFirst({
    where: { id, organizationId: orgId },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { contacts: true } },
    },
  });
  if (!company) notFound();

  const [contacts, notes, tags, canManage, canManageContacts, canManageTags, canCreateNote, canEditNote, canDeleteNote] =
    await Promise.all([
      prisma.contact.findMany({
        where: { organizationId: orgId, companyId: company.id },
        include: {
          company: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
        orderBy: [{ archivedAt: "asc" }, { lastName: "asc" }],
      }),
      prisma.note.findMany({
        where: { organizationId: orgId, companyId: company.id },
        include: { createdBy: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tag.findMany({
        where: { organizationId: orgId },
        orderBy: { name: "asc" },
      }),
      can("companies.manage"),
      can("contacts.manage"),
      can("tags.manage"),
      can("notes.create"),
      can("notes.edit"),
      can("notes.delete"),
    ]);

  const meta = STATUS[company.status];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/companies"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Companies
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-display text-2xl text-[var(--color-foreground)] truncate">
                {company.name}
              </h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
              {company.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
            </div>
            {company.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {company.tags.map(({ tag }) => (
                  <TagChip key={tag.id} name={tag.name} color={tag.color} />
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Created {format(company.createdAt, "MMM d, yyyy")} · {company._count.contacts} contact
              {company._count.contacts === 1 ? "" : "s"}
            </p>
          </div>

          {canManage ? (
            <CompanyDetailActions
              company={{
                id: company.id,
                name: company.name,
                slug: company.slug,
                website: company.website,
                industry: company.industry,
                description: company.description,
                status: company.status,
                size: company.size,
                country: company.country,
                city: company.city,
                address: company.address,
                phone: company.phone,
                email: company.email,
                tagIds: company.tags.map((t) => t.tag.id),
                archivedAt: company.archivedAt,
              }}
              tags={tags}
              canManageTags={canManageTags}
            />
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CompanyOverview company={company} />
        </TabsContent>

        <TabsContent value="contacts">
          <CompanyContactsTab
            companyId={company.id}
            companyName={company.name}
            contacts={contacts}
            tags={tags}
            canManage={canManageContacts}
            canManageTags={canManageTags}
          />
        </TabsContent>

        <TabsContent value="notes">
          <NotesSection
            notes={notes.map((n) => ({
              id: n.id,
              content: n.content,
              createdAt: n.createdAt,
              updatedAt: n.updatedAt,
              createdBy: n.createdBy,
            }))}
            companyId={company.id}
            canCreate={canCreateNote}
            canEdit={canEditNote}
            canDelete={canDeleteNote}
          />
        </TabsContent>

        <TabsContent value="activity">
          <EmptyState
            icon={<IconClockHour3 size={20} />}
            title="Activity timeline coming soon"
            description="Calls, emails, meetings, and pipeline events will land here in a future phase."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
