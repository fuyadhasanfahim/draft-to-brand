import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { NewCampaignPageClient } from "@/features/campaigns/new-campaign-page-client";
import type { ContactOption, LeadOption } from "@/features/campaigns/recipient-selector";

export const metadata = { title: "New campaign" };
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const session = await requireSession();
  if (!(await can("campaigns.view"))) notFound();
  if (!(await can("campaigns.create")) && !(await can("campaigns.manage"))) notFound();
  const orgId = session.member.organizationId;

  const [contacts, leads] = await Promise.all([
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

  const contactOptions: ContactOption[] = contacts.map((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`.trim(),
    email: c.email,
    company: c.company?.name ?? null,
  }));
  const leadOptions: LeadOption[] = leads.map((l) => ({
    id: l.id,
    title: l.title,
    email: l.contact?.email ?? null,
    company: l.company?.name ?? null,
  }));

  return <NewCampaignPageClient contacts={contactOptions} leads={leadOptions} />;
}
