import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { SettingsNav } from "@/features/settings/settings-nav";
import { LeadSourcesPageClient } from "@/features/settings/lead-sources-page-client";

export const metadata = { title: "Lead sources · Settings" };

export default async function LeadSourcesPage() {
  const session = await requireSession();
  if (!(await can("settings.view"))) notFound();

  const orgId = session.member.organizationId;
  const [rows, canManage, canIndustries, canSizes, canPipelines] = await Promise.all([
    prisma.leadSource.findMany({
      where: { organizationId: orgId },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    can("lead-sources.manage"),
    can("industries.manage"),
    can("company-sizes.manage"),
    can("pipelines.manage"),
  ]);

  return (
    <div>
      <PageHeader
        title="Lead sources"
        description="Where leads / companies come from. Used on company records and (later) on Leads + Deals."
      />
      <SettingsNav
        items={[
          { href: "/dashboard/settings/pipelines",     label: "Pipelines",     visible: canPipelines },
          { href: "/dashboard/settings/industries",    label: "Industries",    visible: canIndustries },
          { href: "/dashboard/settings/company-sizes", label: "Company sizes", visible: canSizes },
          { href: "/dashboard/settings/lead-sources",  label: "Lead sources",  visible: canManage },
          { href: "/dashboard/settings/countries",     label: "Countries",     visible: true },
        ]}
      />
      <LeadSourcesPageClient rows={rows} canManage={canManage} />
    </div>
  );
}
