import Link from "next/link";
import { notFound } from "next/navigation";
import {
  IconBuilding,
  IconUsers,
  IconWorld,
  IconTags,
  IconChartArrowsVertical,
} from "@tabler/icons-react";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";

export const metadata = { title: "Settings" };

export default async function SettingsIndex() {
  await requireSession();
  if (!(await can("settings.view"))) notFound();

  const [canIndustries, canSizes, canSources, canPipelines] = await Promise.all([
    can("industries.manage"),
    can("company-sizes.manage"),
    can("lead-sources.manage"),
    can("pipelines.manage"),
  ]);

  const cards = [
    {
      href: "/dashboard/settings/pipelines",
      title: "Pipelines",
      description: "Sales pipelines and stages. Mark stages as WON / LOST to close leads.",
      icon: <IconChartArrowsVertical size={18} />,
      visible: canPipelines,
    },
    {
      href: "/dashboard/settings/industries",
      title: "Industries",
      description: "Curate the industry taxonomy used on Company records.",
      icon: <IconBuilding size={18} />,
      visible: canIndustries,
    },
    {
      href: "/dashboard/settings/company-sizes",
      title: "Company sizes",
      description: "Size buckets like 11–50, 51–200, 1000+. Sort order drives picker rank.",
      icon: <IconUsers size={18} />,
      visible: canSizes,
    },
    {
      href: "/dashboard/settings/lead-sources",
      title: "Lead sources",
      description: "Where leads and companies come from. Colored chips on every row.",
      icon: <IconTags size={18} />,
      visible: canSources,
    },
    {
      href: "/dashboard/settings/countries",
      title: "Countries",
      description: "Global ISO 3166-1 list used in company addresses. Read-only.",
      icon: <IconWorld size={18} />,
      visible: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Reference data and taxonomies that shape the rest of the CRM."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.filter((c) => c.visible).map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="surface-card p-5 hover:border-[var(--color-border-strong)] transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted-foreground)] shrink-0">
                {c.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {c.title}
                </p>
                <p className="mt-1 text-[12px] text-[var(--color-muted-foreground)]">
                  {c.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
