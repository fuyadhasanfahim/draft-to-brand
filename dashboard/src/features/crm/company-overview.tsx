import {
  IconAt,
  IconBuilding,
  IconMapPin,
  IconPhone,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";

export function CompanyOverview({
  company,
}: {
  company: {
    industry: string | null;
    size: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    address: string | null;
    description: string | null;
  };
}) {
  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode | null }> = [
    {
      icon: <IconBuilding size={13} />,
      label: "Industry",
      value: company.industry,
    },
    {
      icon: <IconUsers size={13} />,
      label: "Size",
      value: company.size,
    },
    {
      icon: <IconWorld size={13} />,
      label: "Website",
      value: company.website ? (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-foreground)]"
        >
          {company.website.replace(/^https?:\/\//, "")}
        </a>
      ) : null,
    },
    {
      icon: <IconAt size={13} />,
      label: "Email",
      value: company.email ? (
        <a
          href={`mailto:${company.email}`}
          className="hover:text-[var(--color-foreground)]"
        >
          {company.email}
        </a>
      ) : null,
    },
    {
      icon: <IconPhone size={13} />,
      label: "Phone",
      value: company.phone,
    },
    {
      icon: <IconMapPin size={13} />,
      label: "Location",
      value: [company.city, company.country].filter(Boolean).join(", ") || null,
    },
  ];

  return (
    <div className="surface-card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">Overview</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-3">
            <span className="mt-0.5 text-[var(--color-muted)]">{r.icon}</span>
            <div className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{r.label}</dt>
              <dd className="text-[13px] text-[var(--color-muted-foreground)] truncate">
                {r.value ?? "—"}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {company.address ? (
        <p className="text-[12px] text-[var(--color-muted-foreground)] border-t border-[var(--color-border)] pt-3">
          {company.address}
        </p>
      ) : null}
      {company.description ? (
        <p className="text-[13px] leading-relaxed text-[var(--color-foreground)] border-t border-[var(--color-border)] pt-4 whitespace-pre-wrap">
          {company.description}
        </p>
      ) : null}
    </div>
  );
}
