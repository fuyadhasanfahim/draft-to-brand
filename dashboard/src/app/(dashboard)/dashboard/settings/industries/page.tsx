import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { SettingsNav } from "@/features/settings/settings-nav";
import { IndustriesPageClient } from "@/features/settings/industries-page-client";

export const metadata = { title: "Industries · Settings" };

export default async function IndustriesPage() {
  const session = await requireSession();
  if (!(await can("settings.view"))) notFound();
  if (!(await can("industries.manage")) && !(await can("settings.view"))) notFound();

  const orgId = session.member.organizationId;
  const [rows, canManage, canSizes, canSources, canPipelines] = await Promise.all([
    prisma.industry.findMany({
      where: { organizationId: orgId },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    can("industries.manage"),
    can("company-sizes.manage"),
    can("lead-sources.manage"),
    can("pipelines.manage"),
  ]);

  return (
    <div>
      <PageHeader
        title="Industries"
        description="Pickable values for the Industry field on companies."
      />
      <SettingsNav
        items={[
          { href: "/dashboard/settings/pipelines",     label: "Pipelines",     visible: canPipelines },
          { href: "/dashboard/settings/industries",    label: "Industries",    visible: canManage },
          { href: "/dashboard/settings/company-sizes", label: "Company sizes", visible: canSizes },
          { href: "/dashboard/settings/lead-sources",  label: "Lead sources",  visible: canSources },
          { href: "/dashboard/settings/countries",     label: "Countries",     visible: true },
        ]}
      />
      <IndustriesPageClient rows={rows} canManage={canManage} />
    </div>
  );
}
