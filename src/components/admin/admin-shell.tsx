'use client';

import type { ReactNode } from 'react';
import { IconMenu2 } from '@tabler/icons-react';
import { useUIStore } from '@/lib/stores/ui-store';
import { Sidebar } from './sidebar';

export function AdminShell({
    adminName,
    children,
}: {
    adminName: string;
    children: ReactNode;
}) {
    const openSidebar = useUIStore((s) => s.openSidebar);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Sidebar adminName={adminName} />

            <div className="md:pl-64">
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
                    <button
                        type="button"
                        onClick={openSidebar}
                        aria-label="Open menu"
                        className="text-muted"
                    >
                        <IconMenu2 size={20} />
                    </button>
                    <span className="text-sm font-medium">Blog admin</span>
                </header>

                <main className="px-4 py-8 md:px-10 md:py-12">{children}</main>
            </div>
        </div>
    );
}
