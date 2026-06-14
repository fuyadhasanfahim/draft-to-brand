"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronRight } from "@tabler/icons-react";

const LABELS: Record<string, string> = {
  dashboard: "Overview",
  organization: "Organization",
  branches: "Branches",
  departments: "Departments",
  teams: "Teams",
  members: "Members",
  roles: "Roles",
  audit: "Audit Log",
  settings: "Settings",
};

function humanize(slug: string) {
  return LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center gap-1.5 text-[var(--color-muted)]">
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const last = i === segments.length - 1;
          return (
            <li key={href} className="flex items-center gap-1.5">
              {i > 0 ? <IconChevronRight size={13} className="text-[var(--color-muted)]/60" /> : null}
              {last ? (
                <span className="text-[var(--color-foreground)] font-medium">{humanize(seg)}</span>
              ) : (
                <Link href={href} className="hover:text-[var(--color-foreground)] transition-colors">
                  {humanize(seg)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
