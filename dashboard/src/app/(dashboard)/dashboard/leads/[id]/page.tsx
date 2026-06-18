import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  IconBuilding,
  IconChevronLeft,
  IconUser,
} from "@tabler/icons-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import {
  Badge,
  EmptyState,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { LeadOverview } from "@/features/leads/lead-overview";
import { LeadDetailActions } from "@/features/leads/lead-detail-actions";
import { ConvertLeadButton } from "@/features/clients/convert-lead-button";
import { LeadOwnerReassign } from "@/features/leads/lead-owner-reassign";
import { PrimaryContactSelector } from "@/features/leads/primary-contact-selector";
import {
  LeadActivityTimeline,
  type LeadActivityEntry,
} from "@/features/leads/lead-activity-timeline";
import { NotesSection } from "@/features/crm/notes-section";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; variant: "success" | "warning" | "neutral" | "danger" }> = {
  OPEN: { label: "Open",  variant: "warning" },
  WON:  { label: "Won",   variant: "success" },
  LOST: { label: "Lost",  variant: "danger" },
};

const PRIORITY_META: Record<string, { label: string; variant: "neutral" | "warning" | "danger" }> = {
  LOW:    { label: "Low",    variant: "neutral" },
  MEDIUM: { label: "Medium", variant: "neutral" },
  HIGH:   { label: "High",   variant: "warning" },
  URGENT: { label: "Urgent", variant: "danger" },
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!(await can("leads.view"))) notFound();
  const orgId = session.member.organizationId;

  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: orgId },
    include: {
      company:    { select: { id: true, name: true, primaryContactId: true } },
      contact:    { select: { id: true, firstName: true, lastName: true } },
      leadSource: { select: { id: true, name: true, color: true } },
      owner:      { include: { user: { select: { name: true } } } },
      pipeline:   { select: { id: true, name: true } },
      stage:      { select: { id: true, name: true, color: true } },
      // Phase 2E — surface the converted Client so the UI can swap the
      // Convert CTA for a "Converted" badge.
      client:     { select: { id: true } },
    },
  });
  if (!lead) notFound();

  const companyContacts = lead.companyId
    ? await prisma.contact.findMany({
        where: { organizationId: orgId, companyId: lead.companyId, archivedAt: null },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      })
    : [];

  const [
    activities,
    pipelines,
    companies,
    contacts,
    leadSources,
    owners,
    canEdit,
    canDelete,
    canManage,
    canManageCompanies,
    canCreateClient,
    canManageClients,
    canCreateNote,
    canEditOwnNote,
    canEditAnyNote,
    canDeleteOwnNote,
    canDeleteAnyNote,
    canViewNotes,
    notes,
  ] = await Promise.all([
    prisma.leadActivity.findMany({
      where: { leadId: lead.id },
      include: { createdBy: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    // H2 — include the lead's CURRENT pipeline even if archived, so the
    // edit modal can render it (labeled "[Archived]") and require an
    // explicit reassignment instead of silently swapping it for another.
    prisma.pipeline.findMany({
      where: {
        organizationId: orgId,
        OR: [{ archivedAt: null }, { id: lead.pipelineId }],
      },
      include: {
        stages: {
          select: { id: true, name: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.company.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, firstName: true, lastName: true, companyId: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
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
    can("leads.edit"),
    can("leads.delete"),
    can("leads.manage"),
    can("companies.manage"),
    can("clients.create"),
    can("clients.manage"),
    can("notes.create"),
    can("notes.edit.own"),
    can("notes.edit.any"),
    can("notes.delete.own"),
    can("notes.delete.any"),
    can("notes.view"),
    // Notes attach to the linked company (or contact when no company). We
    // surface them on the Lead's Notes tab so the rep has one place to add
    // context without refactoring the Note model.
    prisma.note.findMany({
      where: {
        organizationId: orgId,
        ...(lead.companyId
          ? { companyId: lead.companyId }
          : lead.contactId
          ? { contactId: lead.contactId }
          : { id: "_never_matches_" }),
      },
      include: { createdBy: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const status = STATUS_META[lead.status];
  const priority = PRIORITY_META[lead.priority];

  const choices = {
    pipelines: pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      isArchived: p.archivedAt !== null,
      stages: p.stages,
    })),
    companies,
    contacts: contacts.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      companyId: c.companyId,
    })),
    leadSources,
    owners: owners.map((m) => ({ id: m.id, name: m.user.name })),
  };

  const activityEntries: LeadActivityEntry[] = activities.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    createdAt: a.createdAt,
    createdBy: a.createdBy,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Leads
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-display text-2xl text-[var(--color-foreground)] truncate">
                {lead.title}
              </h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={priority.variant}>{priority.label}</Badge>
              {lead.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
              {lead.client ? <Badge variant="primary">Converted</Badge> : null}
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {lead.pipeline.name} · {lead.stage.name} · Created{" "}
              {format(lead.createdAt, "MMM d, yyyy")}
            </p>
            {(canEdit || canManage) ? (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                  Owner
                </span>
                <LeadOwnerReassign
                  leadId={lead.id}
                  currentOwnerId={lead.ownerId}
                  owners={choices.owners}
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {lead.status === "WON" &&
            !lead.client &&
            !lead.archivedAt &&
            (canCreateClient || canManageClients) ? (
              <ConvertLeadButton
                leadId={lead.id}
                leadTitle={lead.title}
                companyName={lead.company?.name ?? null}
              />
            ) : null}
            <LeadDetailActions
              lead={{
                id: lead.id,
                title: lead.title,
                companyId: lead.companyId,
                contactId: lead.contactId,
                leadSourceId: lead.leadSourceId,
                ownerId: lead.ownerId,
                pipelineId: lead.pipelineId,
                stageId: lead.stageId,
                status: lead.status,
                priority: lead.priority,
                estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue.toString()) : null,
                currency: lead.currency,
                expectedCloseDate: lead.expectedCloseDate,
                description: lead.description,
              }}
              choices={choices}
              canEdit={canEdit || canManage}
              canDelete={canDelete || canManage}
              isArchived={Boolean(lead.archivedAt)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity ({activityEntries.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <LeadOverview
            lead={{
              pipelineName: lead.pipeline.name,
              stageName: lead.stage.name,
              stageColor: lead.stage.color,
              status: lead.status,
              priority: lead.priority,
              estimatedValue: lead.estimatedValue ? lead.estimatedValue.toString() : null,
              currency: lead.currency,
              expectedCloseDate: lead.expectedCloseDate,
              description: lead.description,
              leadSource: lead.leadSource ? { name: lead.leadSource.name, color: lead.leadSource.color } : null,
              owner: lead.owner ? { name: lead.owner.user.name } : null,
              company: lead.company,
              contact: lead.contact
                ? { id: lead.contact.id, name: `${lead.contact.firstName} ${lead.contact.lastName}` }
                : null,
            }}
          />
        </TabsContent>

        <TabsContent value="activity">
          <LeadActivityTimeline entries={activityEntries} />
        </TabsContent>

        <TabsContent value="notes">
          {!canViewNotes ? (
            <EmptyState title="No access" description="You don't have permission to view notes." />
          ) : !lead.companyId && !lead.contactId ? (
            <EmptyState
              title="Attach a company or contact"
              description="Notes are kept on the linked company or contact. Link one to start a note thread."
            />
          ) : (
            <NotesSection
              notes={notes.map((n) => ({
                id: n.id,
                content: n.content,
                createdAt: n.createdAt,
                updatedAt: n.updatedAt,
                createdById: n.createdById,
                createdBy: n.createdBy,
              }))}
              companyId={lead.companyId ?? undefined}
              contactId={!lead.companyId ? lead.contactId ?? undefined : undefined}
              permissions={{
                currentUserId: session.user.id,
                canCreate: canCreateNote,
                canEditOwn: canEditOwnNote,
                canEditAny: canEditAnyNote,
                canDeleteOwn: canDeleteOwnNote,
                canDeleteAny: canDeleteAnyNote,
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="company">
          {lead.company ? (
            <div className="flex flex-col gap-4">
              <Link
                href={`/dashboard/companies/${lead.company.id}`}
                className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-background)] transition-colors"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
                  <IconBuilding size={16} />
                </span>
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{lead.company.name}</p>
                  <p className="text-[12px] text-[var(--color-muted)]">Open company →</p>
                </div>
              </Link>

              {canManageCompanies ? (
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--color-foreground)]">
                        Primary contact
                      </p>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        The main point of contact at this company.
                      </p>
                    </div>
                    <div className="min-w-[220px]">
                      <PrimaryContactSelector
                        companyId={lead.company.id}
                        primaryContactId={lead.company.primaryContactId}
                        contacts={companyContacts.map((c) => ({
                          id: c.id,
                          name: `${c.firstName} ${c.lastName}`,
                        }))}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {companyContacts.length > 0 ? (
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <p className="px-4 py-2 text-[11px] uppercase tracking-wide text-[var(--color-muted)] border-b border-[var(--color-border)]">
                    All contacts at this company
                  </p>
                  <ul className="divide-y divide-[var(--color-border)]">
                    {companyContacts.map((c) => {
                      const isPrimary = lead.company?.primaryContactId === c.id;
                      return (
                        <li
                          key={c.id}
                          className="flex items-center justify-between px-4 py-2.5"
                        >
                          <span className="text-[13px] text-[var(--color-foreground)]">
                            {c.firstName} {c.lastName}
                          </span>
                          {isPrimary ? (
                            <Badge variant="primary">Primary</Badge>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="No company linked"
              description="Edit this lead to attach it to a company."
            />
          )}
        </TabsContent>

        <TabsContent value="contact">
          {lead.contact ? (
            <div className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
                <IconUser size={16} />
              </span>
              <div>
                <p className="font-medium text-[var(--color-foreground)]">
                  {lead.contact.firstName} {lead.contact.lastName}
                </p>
                <p className="text-[12px] text-[var(--color-muted)]">
                  <Link href="/dashboard/contacts" className="hover:text-[var(--color-foreground)]">
                    Open contacts →
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              title="No contact linked"
              description="Edit this lead to attach a contact."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
