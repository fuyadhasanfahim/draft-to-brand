import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import {
  CampaignsPageClient,
  type CampaignRow,
} from "@/features/campaigns/campaigns-page-client";
import { computeCampaignStats } from "@/features/campaigns/analytics";

export const metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await requireSession();
  if (!(await can("campaigns.view"))) notFound();
  const orgId = session.member.organizationId;

  const [campaigns, canCreate, canEdit, canDelete, canManage] = await Promise.all([
    prisma.emailCampaign.findMany({
      where: { organizationId: orgId },
      include: {
        createdBy: { select: { name: true } },
        recipients: {
          select: {
            sentAt: true,
            openedAt: true,
            clickedAt: true,
            repliedAt: true,
            bouncedAt: true,
          },
        },
      },
      orderBy: [{ archivedAt: "asc" }, { createdAt: "desc" }],
    }),
    can("campaigns.create"),
    can("campaigns.edit"),
    can("campaigns.delete"),
    can("campaigns.manage"),
  ]);

  const rows: CampaignRow[] = campaigns.map((c) => {
    const stats = computeCampaignStats(c.recipients);
    return {
      id: c.id,
      name: c.name,
      subject: c.subject,
      body: c.body,
      fromName: c.fromName,
      replyTo: c.replyTo,
      status: c.status,
      archivedAt: c.archivedAt,
      createdAt: c.createdAt,
      createdByName: c.createdBy?.name ?? null,
      recipients: stats.recipients,
      openRate: stats.openRate,
      clickRate: stats.clickRate,
      bounceRate: stats.bounceRate,
    };
  });

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Cold email campaigns. Build a recipient list from your contacts and leads, then track delivery, opens, and replies."
      />
      <CampaignsPageClient
        campaigns={rows}
        canCreate={canCreate || canManage}
        canEdit={canEdit || canManage}
        canDelete={canDelete || canManage}
      />
    </div>
  );
}
