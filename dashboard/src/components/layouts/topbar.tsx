"use client";

import { useRouter } from "next/navigation";
import { IconBell, IconLogout, IconMenu2, IconSearch, IconUser } from "@tabler/icons-react";
import { authClient } from "@/lib/auth/client";
import {
  Avatar,
  Badge,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui";
import { Breadcrumbs } from "./breadcrumbs";

export interface TopbarProps {
  user: { name: string; email: string; image?: string | null };
  roleName: string;
  onOpenMobileNav?: () => void;
}

export function Topbar({ user, roleName, onOpenMobileNav }: TopbarProps) {
  const router = useRouter();

  const signOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur px-4 lg:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
        aria-label="Open navigation"
      >
        <IconMenu2 size={18} />
      </button>

      <div className="hidden md:block">
        <Breadcrumbs />
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-2 h-9 w-[260px] rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-muted)]">
        <IconSearch size={15} />
        <input
          placeholder="Search…"
          className="flex-1 bg-transparent placeholder:text-[var(--color-muted)] focus:outline-none text-[var(--color-foreground)]"
        />
        <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 text-[10px] text-[var(--color-muted)]">⌘K</kbd>
      </div>

      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-background)]"
        aria-label="Notifications"
      >
        <IconBell size={17} />
      </button>

      <Dropdown>
        <DropdownTrigger>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-[var(--color-background)] transition-colors"
          >
            <Avatar src={user.image ?? undefined} name={user.name} size="sm" />
            <div className="hidden md:flex flex-col leading-tight text-left">
              <span className="text-[13px] font-medium text-[var(--color-foreground)]">{user.name}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{user.email}</span>
            </div>
          </button>
        </DropdownTrigger>
        <DropdownContent>
          <div className="px-2.5 py-2">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{user.name}</p>
            <p className="text-[11px] text-[var(--color-muted)]">{user.email}</p>
            <Badge variant="primary" className="mt-2">{roleName}</Badge>
          </div>
          <DropdownSeparator />
          <DropdownLabel>Account</DropdownLabel>
          <DropdownItem onSelect={() => router.push("/dashboard/settings")}>
            <IconUser size={14} /> Profile & settings
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem destructive onSelect={signOut}>
            <IconLogout size={14} /> Sign out
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </header>
  );
}
