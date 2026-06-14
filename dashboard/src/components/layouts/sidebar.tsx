"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/constants/brand";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./nav-config";
import type { NavItem } from "@/types/navigation";

export interface SidebarProps {
  /** Effective permission keys for the active member. */
  permissions: string[];
  /** Active organization name (shown in workspace switcher). */
  organizationName: string;
  className?: string;
}

function isAllowed(item: NavItem, perms: Set<string>) {
  if (!item.permissions || item.permissions.length === 0) return true;
  return item.permissions.some((p) => perms.has(p));
}

export function Sidebar({ permissions, organizationName, className }: SidebarProps) {
  const pathname = usePathname();
  const perms = new Set(permissions);

  return (
    <aside
      className={cn(
        "flex h-full w-[260px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-[var(--color-border)] px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.logo}
          alt={BRAND.name}
          className="h-7 w-7 rounded-md object-contain"
        />
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-semibold tracking-tight truncate">{BRAND.name}</span>
          <span className="text-[11px] text-[var(--color-muted)] truncate">{organizationName}</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {NAV_SECTIONS.map((section, sIdx) => {
          const visible = section.items.filter((i) => isAllowed(i, perms));
          if (visible.length === 0) return null;
          return (
            <div key={sIdx} className={sIdx > 0 ? "mt-6" : ""}>
              {section.label ? (
                <p className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-medium">
                  {section.label}
                </p>
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {visible.map((item) => {
                  const active =
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href} className="relative">
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "text-[var(--color-foreground)] font-medium"
                            : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                        )}
                      >
                        {active ? (
                          <motion.span
                            layoutId="sidebar-active"
                            transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            className="absolute inset-0 rounded-[8px] bg-[var(--color-background)]"
                          />
                        ) : null}
                        <Icon size={17} className="relative z-10 shrink-0" />
                        <span className="relative z-10 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-border)] px-4 py-3 text-[11px] text-[var(--color-muted)]">
        v0.1 · Phase 0
      </div>
    </aside>
  );
}
