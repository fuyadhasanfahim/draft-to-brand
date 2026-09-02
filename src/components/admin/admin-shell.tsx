'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
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
        <div className="relative min-h-screen bg-background text-foreground">
            <div
                aria-hidden
                className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)] opacity-60"
            />

            <Sidebar adminName={adminName} />

            <div className="relative md:pl-64">
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
                    <button
                        type="button"
                        onClick={openSidebar}
                        aria-label="Open navigation menu"
                        title="Open navigation menu"
                        className="text-muted"
                    >
                        <IconMenu2 size={20} />
                    </button>
                    <Image
                        src="/logo.png"
                        width={1040}
                        height={338}
                        alt="Draft To Brand"
                        className="h-5 w-auto object-contain"
                        priority
                    />
                </header>

                <main className="w-full px-4 py-8 md:px-10 md:py-14">
                    {children}
                </main>
            </div>
        </div>
    );
}
