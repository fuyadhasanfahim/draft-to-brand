"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SettingsNavItem = {
  href: string;
  label: string;
  visible: boolean;
};

/**
 * Persistent sub-nav rendered at the top of every /dashboard/settings page.
 * Items the active member can't access are hidden (server passes `visible`).
 */
export function SettingsNav({ items }: { items: SettingsNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav
      role="tablist"
      className="surface-card flex gap-1 overflow-x-auto scrollbar-thin p-1 mb-5"
    >
      {items.filter((i) => i.visible).map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "inline-flex items-center rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "bg-[var(--color-dark)] text-white"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
