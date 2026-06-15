import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import {
  NewLeadPageClient,
  type NewLeadChoices,
  type ExistingCompanyOption,
  type ExistingContactOption,
} from "@/features/leads/new-lead-page-client";

export const metadata = { title: "New lead" };
export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
  const session = await requireSession();
  if (!(await can("leads.view"))) notFound();
  if (!(await can("leads.create")) && !(await can("leads.manage"))) notFound();
  const orgId = session.member.organizationId;

  // Start of today in the request timezone — used for the "Today" counter.
  // We compute UTC midnight here for simplicity; for sub-day rollover edge
  // cases per timezone, swap to a tz-aware boundary later.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    pipelines,
    industries,
    countries,
    companySizes,
    leadSources,
    existingCompanies,
    existingContacts,
    todayLeadCount,
  ] = await Promise.all([
    prisma.pipeline.findMany({
      where: { organizationId: orgId, archivedAt: null },
      include: {
        stages: {
          select: { id: true, name: true, outcome: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
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
      select: { id: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.leadSource.findMany({
      where: { organizationId: orgId, isActive: true, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    // Existing companies — surfaced via the search combobox so reps can
    // attach a lead to a known company instead of creating a duplicate.
    prisma.company.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: {
        id: true,
        name: true,
        website: true,
        industryId: true,
        countryId: true,
        companySizeId: true,
        leadSourceId: true,
      },
      orderBy: { name: "asc" },
    }),
    // Existing contacts — filtered client-side by selected company.
    prisma.contact.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        linkedinUrl: true,
        companyId: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.lead.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: startOfDay },
        createdById: session.user.id,
      },
    }),
  ]);

  if (pipelines.length === 0 || pipelines.every((p) => p.stages.length === 0)) {
    redirect("/dashboard/settings/pipelines");
  }

  const choices: NewLeadChoices = {
    pipelines: pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      isDefault: p.isDefault,
      stages: p.stages,
    })),
    industries,
    countries,
    companySizes,
    leadSources,
  };

  const companies: ExistingCompanyOption[] = existingCompanies;
  const contacts: ExistingContactOption[] = existingContacts;

  return (
    <NewLeadPageClient
      choices={choices}
      existingCompanies={companies}
      existingContacts={contacts}
      initialTodayCount={todayLeadCount}
    />
  );
}
