import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { SettingsNav } from "@/features/settings/settings-nav";
import {
  PipelinesPageClient,
  type PipelineWithStagesAndCounts,
} from "@/features/leads/pipelines-page-client";

export const metadata = { title: "Pipelines · Settings" };

export default async function PipelinesSettingsPage() {
  const session = await requireSession();
  if (!(await can("settings.view"))) notFound();
  if (!(await can("pipelines.manage")) && !(await can("leads.view"))) notFound();
  const orgId = session.member.organizationId;

  const [pipelines, canManage, canIndustries, canSizes, canSources] = await Promise.all([
    prisma.pipeline.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { leads: true } },
        stages: {
          include: { _count: { select: { leads: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ archivedAt: "asc" }, { isDefault: "desc" }, { name: "asc" }],
    }),
    can("pipelines.manage"),
    can("industries.manage"),
    can("company-sizes.manage"),
    can("lead-sources.manage"),
  ]);

  const rows: PipelineWithStagesAndCounts[] = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    isDefault: p.isDefault,
    archivedAt: p.archivedAt,
    leadCount: p._count.leads,
    stages: p.stages.map((s) => ({
      id: s.id,
      pipelineId: s.pipelineId,
      name: s.name,
      slug: s.slug,
      color: s.color,
      sortOrder: s.sortOrder,
      winProbability: s.winProbability,
      outcome: s.outcome,
      leadCount: s._count.leads,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Pipelines"
        description="Define the stages your leads move through. Drag stages to reorder."
      />
      <SettingsNav
        items={[
          { href: "/dashboard/settings/pipelines",     label: "Pipelines",     visible: canManage },
          { href: "/dashboard/settings/industries",    label: "Industries",    visible: canIndustries },
          { href: "/dashboard/settings/company-sizes", label: "Company sizes", visible: canSizes },
          { href: "/dashboard/settings/lead-sources",  label: "Lead sources",  visible: canSources },
          { href: "/dashboard/settings/countries",     label: "Countries",     visible: true },
        ]}
      />
      <PipelinesPageClient pipelines={rows} canManage={canManage} />
    </div>
  );
}
