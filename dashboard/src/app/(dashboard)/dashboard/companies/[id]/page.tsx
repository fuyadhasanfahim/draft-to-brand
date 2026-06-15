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
      industry: { select: { id: true, name: true } },
      country: { select: { id: true, name: true } },
      companySize: { select: { id: true, name: true } },
      leadSource: { select: { id: true, name: true, color: true } },
      owner: { include: { user: { select: { name: true } } } },
      primaryContact: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!company) notFound();

  const [
    contacts,
    notes,
    tags,
    industries,
    countries,
    companySizes,
    leadSources,
    owners,
    canManage,
    canManageContacts,
    canManageTags,
    canCreateNote,
    canEditOwnNote,
    canEditAnyNote,
    canDeleteOwnNote,
    canDeleteAnyNote,
  ] = await Promise.all([
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
    prisma.industry.findMany({
      where: { organizationId: orgId, isActive: true, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.country.findMany({
      select: { id: true, name: true, iso2: true },
      orderBy: { name: "asc" },
    }),
    prisma.companySize.findMany({
      where: { organizationId: orgId, isActive: true, archivedAt: null },
      select: { id: true, name: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.leadSource.findMany({
      where: { organizationId: orgId, isActive: true, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.member.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      include: { user: { select: { name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    can("companies.manage"),
    can("contacts.manage"),
    can("tags.manage"),
    can("notes.create"),
    can("notes.edit.own"),
    can("notes.edit.any"),
    can("notes.delete.own"),
    can("notes.delete.any"),
  ]);

  const ownerChoices = owners.map((m) => ({ id: m.id, name: m.user.name }));
  const primaryContactCandidates = contacts.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

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
                description: company.description,
                status: company.status,
                industryId: company.industryId,
                countryId: company.countryId,
                companySizeId: company.companySizeId,
                leadSourceId: company.leadSourceId,
                ownerId: company.ownerId,
                primaryContactId: company.primaryContactId,
                city: company.city,
                address: company.address,
                phone: company.phone,
                email: company.email,
                tagIds: company.tags.map((t) => t.tag.id),
                archivedAt: company.archivedAt,
              }}
              tags={tags}
              canManageTags={canManageTags}
              industries={industries}
              countries={countries}
              companySizes={companySizes}
              leadSources={leadSources}
              owners={ownerChoices}
              primaryContactCandidates={primaryContactCandidates}
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
          <CompanyOverview
            company={{
              industry: company.industry,
              companySize: company.companySize,
              country: company.country,
              leadSource: company.leadSource,
              owner: company.owner ? { name: company.owner.user.name } : null,
              primaryContact: company.primaryContact
                ? { name: `${company.primaryContact.firstName} ${company.primaryContact.lastName}` }
                : null,
              website: company.website,
              email: company.email,
              phone: company.phone,
              city: company.city,
              address: company.address,
              description: company.description,
            }}
          />
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
              createdById: n.createdById,
              createdBy: n.createdBy,
            }))}
            companyId={company.id}
            permissions={{
              currentUserId: session.user.id,
              canCreate: canCreateNote,
              canEditOwn: canEditOwnNote,
              canEditAny: canEditAnyNote,
              canDeleteOwn: canDeleteOwnNote,
              canDeleteAny: canDeleteAnyNote,
            }}
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
