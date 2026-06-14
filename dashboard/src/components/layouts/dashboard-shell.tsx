"use client";

import * as React from "react";
import { Sheet } from "@/components/ui";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export interface DashboardShellProps {
  user: { name: string; email: string; image?: string | null };
  organizationName: string;
  roleName: string;
  permissions: string[];
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  organizationName,
  roleName,
  permissions,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar permissions={permissions} organizationName={organizationName} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="left" width="w-[280px]">
        <Sidebar
          permissions={permissions}
          organizationName={organizationName}
          className="border-r-0 w-full"
        />
      </Sheet>

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <Topbar user={user} roleName={roleName} onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
