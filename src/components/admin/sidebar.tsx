"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    IconArticle,
    IconPencilPlus,
    IconLogout,
    IconX,
    IconArrowUpRight,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth/actions";
import { useUIStore } from "@/lib/stores/ui-store";

const navItems = [
    {
        label: "All posts",
        href: "/admin/blogs",
        icon: IconArticle,
        title: "View and manage all blog posts",
    },
    {
        label: "New post",
        href: "/admin/blogs/new",
        icon: IconPencilPlus,
        title: "Write a new blog post",
    },
];

function isActive(pathname: string, href: string): boolean {
    if (href === "/admin/blogs") {
        return (
            pathname === "/admin/blogs" ||
            (pathname.startsWith("/admin/blogs/") &&
                !pathname.startsWith("/admin/blogs/new"))
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
                    aria-label="Close navigation menu"
                    title="Close navigation menu"
                    onClick={closeSidebar}
                    className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm md:hidden"
                />
            )}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex items-center justify-between px-5 pt-6">
                    <Link
                        href="/admin/blogs"
                        onClick={closeSidebar}
                        className="inline-flex items-center"
                        aria-label="Draft To Brand — go to blog posts"
                        title="Draft To Brand — go to blog posts"
                    >
                        <Image
                            src="/logo.png"
                            width={1040}
                            height={338}
                            alt="Draft To Brand"
                            className="h-12 w-auto object-contain"
                            priority
                        />
                    </Link>
                    <button
                        type="button"
                        onClick={closeSidebar}
                        aria-label="Close navigation menu"
                        title="Close navigation menu"
                        className="text-muted md:hidden"
                    >
                        <IconX size={18} />
                    </button>
                </div>

                <nav className="mt-8 flex flex-1 flex-col gap-1 px-3">
                    {navItems.map(({ label, href, icon: Icon, title }) => {
                        const active = isActive(pathname, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={closeSidebar}
                                aria-current={active ? "page" : undefined}
                                aria-label={title}
                                title={title}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                    active
                                        ? "bg-foreground text-background"
                                        : "text-muted hover:bg-foreground/5 hover:text-foreground",
                                )}
                            >
                                <Icon size={17} stroke={2} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mx-3 mb-3 rounded-xl border border-border bg-white/60 p-3">
                    <Link
                        href="/"
                        target="_blank"
                        aria-label="Open the public site in a new tab"
                        title="Open the public site in a new tab"
                        className="flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
                    >
                        View live site
                        <IconArrowUpRight size={13} stroke={2} />
                    </Link>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="truncate text-sm font-medium text-foreground">
                            {adminName}
                        </span>
                        <form action={logout}>
                            <button
                                type="submit"
                                aria-label="Sign out of the admin dashboard"
                                title="Sign out of the admin dashboard"
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-red-100 hover:text-red-600 focus:bg-red-100 focus:text-red-600 active:bg-red-200 active:text-red-700 cursor-pointer"
                            >
                                <IconLogout size={14} stroke={2} />
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            </aside>
        </>
    );
}
