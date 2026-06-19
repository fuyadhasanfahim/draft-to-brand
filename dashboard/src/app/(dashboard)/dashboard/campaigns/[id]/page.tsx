import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { IconChevronLeft } from "@tabler/icons-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { CampaignStatusBadge } from "@/features/campaigns/campaign-badges";
import { CampaignDetailActions } from "@/features/campaigns/campaign-detail-actions";
import { CampaignOverview } from "@/features/campaigns/campaign-overview";
import {
  CampaignRecipientsTable,
  type CampaignRecipientRow,
} from "@/features/campaigns/campaign-recipients-table";
import {
  CampaignActivityTimeline,
  type CampaignActivityEntry,
} from "@/features/campaigns/campaign-activity-timeline";
import { computeCampaignStats } from "@/features/campaigns/analytics";
import type { ContactOption, LeadOption } from "@/features/campaigns/recipient-selector";
import { CampaignSequenceAttach } from "@/features/campaigns/campaign-sequence-attach";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!(await can("campaigns.view"))) notFound();
  const orgId = session.member.organizationId;

  const campaign = await prisma.emailCampaign.findFirst({
    where: { id, organizationId: orgId },
    include: {
      createdBy: { select: { name: true } },
      sequence: { select: { id: true, name: true } },
      recipients: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          contactId: true,
          leadId: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          repliedAt: true,
          bouncedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!campaign) notFound();

  const [
    events,
    followupsSent,
    activeSequences,
    canEdit,
    canDelete,
    canManage,
    allContacts,
    allLeads,
  ] = await Promise.all([
      prisma.emailEvent.findMany({
        where: { recipient: { campaignId: campaign.id } },
        include: {
          recipient: { select: { email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.emailEvent.count({
        where: { type: "FOLLOWUP_SENT", recipient: { campaignId: campaign.id } },
      }),
      prisma.emailSequence.findMany({
        where: { organizationId: orgId, isActive: true, archivedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      can("campaigns.edit"),
      can("campaigns.delete"),
      can("campaigns.manage"),
      prisma.contact.findMany({
        where: { organizationId: orgId, archivedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: { select: { name: true } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      prisma.lead.findMany({
        where: { organizationId: orgId, archivedAt: null },
        select: {
          id: true,
          title: true,
          contact: { select: { email: true } },
          company: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const stats = computeCampaignStats(campaign.recipients);

  const recipientRows: CampaignRecipientRow[] = campaign.recipients.map((r) => ({
    id: r.id,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    status: r.status,
    source: r.leadId ? "lead" : r.contactId ? "contact" : "manual",
    sentAt: r.sentAt,
    createdAt: r.createdAt,
  }));

  // Exclude contacts/leads already on the campaign from the "add" picker.
  const usedContactIds = new Set(
    campaign.recipients.map((r) => r.contactId).filter(Boolean) as string[]
  );
  const usedLeadIds = new Set(
    campaign.recipients.map((r) => r.leadId).filter(Boolean) as string[]
  );
  const availableContacts: ContactOption[] = allContacts
    .filter((c) => !usedContactIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      company: c.company?.name ?? null,
    }));
  const availableLeads: LeadOption[] = allLeads
    .filter((l) => !usedLeadIds.has(l.id))
    .map((l) => ({
      id: l.id,
      title: l.title,
      email: l.contact?.email ?? null,
      company: l.company?.name ?? null,
    }));

  const activityEntries: CampaignActivityEntry[] = events.map((e) => ({
    id: e.id,
    type: e.type,
    createdAt: e.createdAt,
    recipientEmail: e.recipient.email,
    recipientName:
      [e.recipient.firstName, e.recipient.lastName].filter(Boolean).join(" ").trim() ||
      null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Campaigns
        </Link>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-display text-2xl text-[var(--color-foreground)] truncate">
                {campaign.name}
              </h1>
              <CampaignStatusBadge status={campaign.status} />
              {campaign.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Created {format(campaign.createdAt, "MMM d, yyyy")}
              {campaign.createdBy?.name ? ` · by ${campaign.createdBy.name}` : ""} ·{" "}
              {stats.recipients} recipient{stats.recipients === 1 ? "" : "s"}
            </p>
          </div>

          <CampaignDetailActions
            campaign={{
              id: campaign.id,
              name: campaign.name,
              subject: campaign.subject,
              body: campaign.body,
              fromName: campaign.fromName,
              replyTo: campaign.replyTo,
            }}
            status={campaign.status}
            isArchived={Boolean(campaign.archivedAt)}
            recipientCount={stats.recipients}
            canEdit={canEdit || canManage}
            canDelete={canDelete || canManage}
          />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Recipients ({stats.recipients})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="flex flex-col gap-4">
            <CampaignOverview
              campaign={{
                subject: campaign.subject,
                body: campaign.body,
                fromName: campaign.fromName,
                replyTo: campaign.replyTo,
                createdByName: campaign.createdBy?.name ?? null,
                createdAt: campaign.createdAt,
              }}
              stats={stats}
              followupsSent={followupsSent}
            />
            <CampaignSequenceAttach
              campaignId={campaign.id}
              status={campaign.status}
              currentSequenceId={campaign.sequenceId}
              currentSequenceName={campaign.sequence?.name ?? null}
              sequences={activeSequences}
              canEdit={canEdit || canManage}
            />
          </div>
        </TabsContent>

        <TabsContent value="recipients">
          <CampaignRecipientsTable
            campaignId={campaign.id}
            recipients={recipientRows}
            availableContacts={availableContacts}
            availableLeads={availableLeads}
            canEdit={canEdit || canManage}
            isDraft={campaign.status === "DRAFT"}
          />
        </TabsContent>

        <TabsContent value="activity">
          <CampaignActivityTimeline entries={activityEntries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
