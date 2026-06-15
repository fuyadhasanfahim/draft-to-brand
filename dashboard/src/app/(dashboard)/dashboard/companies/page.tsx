import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { CompaniesPageClient } from "@/features/crm/companies-page-client";

export const metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const session = await requireSession();
  if (!(await can("companies.view"))) notFound();

  const orgId = session.member.organizationId;
  const [companies, tags, industries, countries, companySizes, leadSources, owners, canManage, canManageTags] =
    await Promise.all([
      prisma.company.findMany({
        where: { organizationId: orgId },
        include: {
          _count: { select: { contacts: true } },
          tags: { include: { tag: true } },
          industry: { select: { id: true, name: true } },
          country: { select: { id: true, name: true, iso2: true } },
          companySize: { select: { id: true, name: true } },
          leadSource: { select: { id: true, name: true, color: true } },
        },
        orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
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
      can("tags.manage"),
    ]);

  const ownerChoices = owners.map((m) => ({ id: m.id, name: m.user.name }));

  return (
    <div>
      <PageHeader
        title="Companies"
        description="The CRM's root record — every contact, note, and (later) deal hangs off a company."
      />
      <CompaniesPageClient
        companies={companies}
        tags={tags}
        canManage={canManage}
        canManageTags={canManageTags}
        industries={industries}
        countries={countries}
        companySizes={companySizes}
        leadSources={leadSources}
        owners={ownerChoices}
      />
    </div>
  );
}
