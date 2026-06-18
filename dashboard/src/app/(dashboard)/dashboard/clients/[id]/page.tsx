import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { IconChevronLeft, IconUser } from "@tabler/icons-react";
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
import { ClientOverview } from "@/features/clients/client-overview";
import { ClientDetailActions } from "@/features/clients/client-detail-actions";
import { NotesSection } from "@/features/crm/notes-section";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; variant: "success" | "neutral" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "neutral" },
};

const ONBOARDING_META: Record<
  string,
  { label: string; variant: "neutral" | "warning" | "success" }
> = {
  NOT_STARTED: { label: "Not started", variant: "neutral" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!(await can("clients.view"))) notFound();
  const orgId = session.member.organizationId;

  const client = await prisma.client.findFirst({
    where: { id, organizationId: orgId },
    include: {
      company: { select: { id: true, name: true, primaryContactId: true } },
      owner: { include: { user: { select: { name: true } } } },
      lead: { select: { id: true, title: true } },
    },
  });
  if (!client) notFound();

  const [
    companies,
    owners,
    companyContacts,
    notes,
    canEdit,
    canDelete,
    canManage,
    canViewNotes,
    canCreateNote,
    canEditOwnNote,
    canEditAnyNote,
    canDeleteOwnNote,
    canDeleteAnyNote,
  ] = await Promise.all([
    prisma.company.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.member.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      include: { user: { select: { name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.contact.findMany({
      where: { organizationId: orgId, companyId: client.companyId, archivedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    // Notes are scoped to the linked Company (consistent with Lead detail —
    // notes don't grow a new clientId column in this phase).
    prisma.note.findMany({
      where: { organizationId: orgId, companyId: client.companyId },
      include: { createdBy: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    can("clients.edit"),
    can("clients.delete"),
    can("clients.manage"),
    can("notes.view"),
    can("notes.create"),
    can("notes.edit.own"),
    can("notes.edit.any"),
    can("notes.delete.own"),
    can("notes.delete.any"),
  ]);

  const choices = {
    companies,
    owners: owners.map((m) => ({ id: m.id, name: m.user.name })),
  };

  const status = STATUS_META[client.status];
  const onboarding = ONBOARDING_META[client.onboardingStatus];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Clients
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-display text-2xl text-[var(--color-foreground)] truncate">
                {client.company.name}
              </h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={onboarding.variant}>Onboarding: {onboarding.label}</Badge>
              {client.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
              {client.lead ? <Badge variant="primary">Converted from lead</Badge> : null}
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Created {format(client.createdAt, "MMM d, yyyy")}
              {client.owner ? ` · Owner: ${client.owner.user.name}` : ""}
            </p>
          </div>

          <ClientDetailActions
            client={{
              id: client.id,
              companyId: client.companyId,
              ownerId: client.ownerId,
              status: client.status,
              onboardingStatus: client.onboardingStatus,
              startDate: client.startDate,
              notes: client.notes,
            }}
            choices={choices}
            canEdit={canEdit || canManage}
            canDelete={canDelete || canManage}
            isArchived={Boolean(client.archivedAt)}
          />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="contacts">Contacts ({companyContacts.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="portal">Portal users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClientOverview
            client={{
              status: client.status,
              onboardingStatus: client.onboardingStatus,
              startDate: client.startDate,
              notes: client.notes,
              owner: client.owner ? { name: client.owner.user.name } : null,
              company: client.company,
              lead: client.lead,
            }}
          />
        </TabsContent>

        <TabsContent value="company">
          <Link
            href={`/dashboard/companies/${client.company.id}`}
            className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:bg-[var(--color-background)] transition-colors"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
              <IconUser size={16} />
            </span>
            <div>
              <p className="font-medium text-[var(--color-foreground)]">
                {client.company.name}
              </p>
              <p className="text-[12px] text-[var(--color-muted)]">Open company →</p>
            </div>
          </Link>
        </TabsContent>

        <TabsContent value="contacts">
          {companyContacts.length === 0 ? (
            <EmptyState
              title="No contacts attached"
              description="Add contacts to the linked company to populate this list."
            />
          ) : (
            <ul className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
              {companyContacts.map((c) => {
                const isPrimary = client.company.primaryContactId === c.id;
                return (
                  <li
                    key={c.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex flex-col leading-tight min-w-0">
                      <span className="text-[13px] font-medium text-[var(--color-foreground)] truncate">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-[11px] text-[var(--color-muted)] truncate">
                        {c.email ?? "—"}
                        {c.jobTitle ? ` · ${c.jobTitle}` : ""}
                      </span>
                    </div>
                    {isPrimary ? <Badge variant="primary">Primary</Badge> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="notes">
          {!canViewNotes ? (
            <EmptyState
              title="No access"
              description="You don't have permission to view notes."
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
              companyId={client.companyId}
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

        <TabsContent value="projects">
          <EmptyState
            title="Projects · Coming in future phase"
            description="Project tracking will land alongside Tasks and Invoices."
          />
        </TabsContent>
        <TabsContent value="invoices">
          <EmptyState
            title="Invoices · Coming in future phase"
            description="Billing surfaces will follow the Client foundation."
          />
        </TabsContent>
        <TabsContent value="contracts">
          <EmptyState
            title="Contracts · Coming in future phase"
            description="Document storage and e-sign integration are planned for a later phase."
          />
        </TabsContent>
        <TabsContent value="portal">
          <EmptyState
            title="Portal users · Coming in future phase"
            description="External client logins will be scoped via Better Auth in a future phase."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
