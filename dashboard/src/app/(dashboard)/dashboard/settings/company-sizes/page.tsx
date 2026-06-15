import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { SettingsNav } from "@/features/settings/settings-nav";
import { CompanySizesPageClient } from "@/features/settings/company-sizes-page-client";

export const metadata = { title: "Company sizes · Settings" };

export default async function CompanySizesPage() {
  const session = await requireSession();
  if (!(await can("settings.view"))) notFound();

  const orgId = session.member.organizationId;
  const [rows, canManage, canIndustries, canSources] = await Promise.all([
    prisma.companySize.findMany({
      where: { organizationId: orgId },
      orderBy: [{ archivedAt: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    can("company-sizes.manage"),
    can("industries.manage"),
    can("lead-sources.manage"),
  ]);

  return (
    <div>
      <PageHeader
        title="Company sizes"
        description="Size buckets used in the Company size picker. Sort order controls picker rank."
      />
      <SettingsNav
        items={[
          { href: "/dashboard/settings/industries",    label: "Industries",    visible: canIndustries },
          { href: "/dashboard/settings/company-sizes", label: "Company sizes", visible: canManage },
          { href: "/dashboard/settings/lead-sources",  label: "Lead sources",  visible: canSources },
          { href: "/dashboard/settings/countries",     label: "Countries",     visible: true },
        ]}
      />
      <CompanySizesPageClient rows={rows} canManage={canManage} />
    </div>
  );
}
