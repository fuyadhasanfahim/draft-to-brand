import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui";
import { SettingsNav } from "@/features/settings/settings-nav";

export const metadata = { title: "Countries · Settings" };

export default async function CountriesPage() {
  await requireSession();
  if (!(await can("settings.view"))) notFound();

  const [countries, canIndustries, canSizes, canSources, canPipelines] = await Promise.all([
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    can("industries.manage"),
    can("company-sizes.manage"),
    can("lead-sources.manage"),
    can("pipelines.manage"),
  ]);

  return (
    <div>
      <PageHeader
        title="Countries"
        description="Global ISO 3166-1 catalog. System-managed — admins cannot edit."
        actions={<Badge variant="neutral">Read-only · {countries.length} entries</Badge>}
      />
      <SettingsNav
        items={[
          { href: "/dashboard/settings/pipelines",     label: "Pipelines",     visible: canPipelines },
          { href: "/dashboard/settings/industries",    label: "Industries",    visible: canIndustries },
          { href: "/dashboard/settings/company-sizes", label: "Company sizes", visible: canSizes },
          { href: "/dashboard/settings/lead-sources",  label: "Lead sources",  visible: canSources },
          { href: "/dashboard/settings/countries",     label: "Countries",     visible: true },
        ]}
      />

      <div className="surface-card overflow-x-auto scrollbar-thin">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface)] text-left text-[11px] uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-border)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">ISO-2</th>
              <th className="px-4 py-3 font-medium">ISO-3</th>
              <th className="px-4 py-3 font-medium">Phone code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {countries.map((c) => (
              <tr key={c.id} className="hover:bg-[var(--color-background)] transition-colors">
                <td className="px-4 py-2.5 text-[var(--color-foreground)]">{c.name}</td>
                <td className="px-4 py-2.5">
                  <code className="text-[12px] font-mono text-[var(--color-muted-foreground)]">{c.iso2}</code>
                </td>
                <td className="px-4 py-2.5">
                  <code className="text-[12px] font-mono text-[var(--color-muted-foreground)]">{c.iso3}</code>
                </td>
                <td className="px-4 py-2.5 tabular-nums text-[var(--color-muted-foreground)]">+{c.phoneCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
