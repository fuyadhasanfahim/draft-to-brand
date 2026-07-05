'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { IconMenu2 } from '@tabler/icons-react';
import { navLinks, siteConfig } from '@/lib/site';
import { cn } from '@/lib/utils';
import { MobileMenu } from './mobile-menu';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <motion.header
                initial={{ y: -24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:px-6 md:pt-5"
            >
                <div
                    className={cn(
                        'flex w-full items-center justify-between rounded-full px-4 py-2.5 md:px-5 md:py-3 transition-[max-width,background,box-shadow,border-color,padding] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]',
                        scrolled
                            ? 'max-w-[880px] glass-floating shadow-[0_20px_60px_-20px_rgba(40,42,42,0.18)] md:py-2'
                            : 'max-w-[1240px] bg-white/40 backdrop-blur-md border border-transparent',
                    )}
                >
                    <Link
                        href="/"
                        className="flex items-center"
                        aria-label={siteConfig.name}
                    >
                        <Image
                            src="/https://res.cloudinary.com/dqfvrpai8/image/upload/q_auto/f_auto/v1781429056/logo_opnmsj.png"
                            width={420}
                            height={140}
                            alt={siteConfig.name}
                            className="h-8 w-auto object-contain md:h-9"
                            priority
                        />
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => {
                            const active = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'relative rounded-full px-4 py-2 text-[14px] font-medium transition-colors',
                                        active
                                            ? 'text-foreground'
                                            : 'text-muted hover:text-foreground',
                                    )}
                                >
                                    {active && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 -z-10 rounded-full bg-[#282a2a]/[0.07]"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 360,
                                                damping: 32,
                                            }}
                                        />
                                    )}
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/contact"
                            className="btn-accent hidden h-10 px-5 py-0 text-sm md:inline-flex"
                        >
                            Book a Call
                        </Link>
                        <button
                            onClick={() => setOpen(true)}
                            aria-label="Open menu"
                            className="grid h-10 w-10 place-items-center rounded-full bg-[#282a2a] text-white md:hidden"
                        >
                            <IconMenu2 size={18} />
                        </button>
                    </div>
                </div>
            </motion.header>

            <MobileMenu open={open} onClose={() => setOpen(false)} />
        </>
    );
}
