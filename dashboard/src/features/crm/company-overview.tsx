import {
  IconAt,
  IconBuilding,
  IconMapPin,
  IconPhone,
  IconUsers,
  IconWorld,
} from "@tabler/icons-react";
import { isSafeUrl } from "@/lib/safe-url";

export function CompanyOverview({
  company,
}: {
  company: {
    industry: { name: string } | null;
    companySize: { name: string } | null;
    country: { name: string } | null;
    leadSource: { name: string; color: string } | null;
    owner: { name: string } | null;
    primaryContact: { name: string } | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    address: string | null;
    description: string | null;
  };
}) {
  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode | null }> = [
    {
      icon: <IconBuilding size={13} />,
      label: "Industry",
      value: company.industry?.name ?? null,
    },
    {
      icon: <IconUsers size={13} />,
      label: "Size",
      value: company.companySize?.name ?? null,
    },
    {
      icon: <IconWorld size={13} />,
      label: "Website",
      // isSafeUrl returns null for any non-http(s) scheme — defense in depth
      // on top of the Zod validator.
      value: (() => {
        const href = isSafeUrl(company.website);
        if (!href) return null;
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-foreground)]"
          >
            {href.replace(/^https?:\/\//, "")}
          </a>
        );
      })(),
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
      value: [company.city, company.country?.name].filter(Boolean).join(", ") || null,
    },
    {
      icon: <IconBuilding size={13} />,
      label: "Lead source",
      value: company.leadSource?.name ?? null,
    },
    {
      icon: <IconUsers size={13} />,
      label: "Account owner",
      value: company.owner?.name ?? null,
    },
    {
      icon: <IconUsers size={13} />,
      label: "Primary contact",
      value: company.primaryContact?.name ?? null,
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
