'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    IconArticle,
    IconPencilPlus,
    IconLogout,
    IconX,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/auth/actions';
import { useUIStore } from '@/lib/stores/ui-store';

const navItems = [
    { label: 'All posts', href: '/admin/blogs', icon: IconArticle },
    { label: 'New post', href: '/admin/blogs/new', icon: IconPencilPlus },
];

function isActive(pathname: string, href: string): boolean {
    if (href === '/admin/blogs') {
        return (
            pathname === '/admin/blogs' ||
            (pathname.startsWith('/admin/blogs/') &&
                !pathname.startsWith('/admin/blogs/new'))
        );
    }
    return pathname === href;
}

export function Sidebar({ adminName }: { adminName: string }) {
    const pathname = usePathname();
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const closeSidebar = useUIStore((s) => s.closeSidebar);

    return (
        <>
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={closeSidebar}
                    className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface px-4 py-6 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex items-center justify-between px-2">
                    <span className="text-display text-lg font-medium tracking-tight">
                        Draft&nbsp;To&nbsp;Brand
                    </span>
                    <button
                        type="button"
                        onClick={closeSidebar}
                        aria-label="Close menu"
                        className="text-muted md:hidden"
                    >
                        <IconX size={18} />
                    </button>
                </div>
                <p className="mt-1 px-2 text-xs tracking-wide text-muted uppercase">
                    Blog admin
                </p>

                <nav className="mt-8 flex flex-1 flex-col gap-1">
                    {navItems.map(({ label, href, icon: Icon }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={closeSidebar}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-foreground text-background'
                                        : 'text-muted hover:bg-foreground/5 hover:text-foreground',
                                )}
                            >
                                <Icon size={17} stroke={2} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-border pt-4">
                    <p className="px-3 text-sm font-medium text-foreground">
                        {adminName}
                    </p>
                    <form action={logout}>
                        <button
                            type="submit"
                            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
                        >
                            <IconLogout size={16} stroke={2} />
                            Sign out
                        </button>
                    </form>
                </div>
            </aside>
        </>
    );
}
