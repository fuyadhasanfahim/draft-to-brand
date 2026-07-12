import Image from 'next/image';
import Link from 'next/link';
import { siteConfig, navLinks } from '@/lib/site';
import {
    IconBrandInstagram,
    IconBrandLinkedin,
    IconBrandX,
} from '@tabler/icons-react';
import { services } from '@/lib/data';

export function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="relative mt-24 overflow-hidden bg-[#282a2a] text-white md:mt-32">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-[#ff3131]/20 blur-[140px]"
            />
            <div className="mx-auto w-full max-w-[1280px] px-6 md:px-10">
                <div className="grid grid-cols-1 gap-12 pt-20 pb-14 md:grid-cols-12 md:gap-16 md:pt-24 md:pb-16">
                    <div className="md:col-span-5">
                        <div className="inline-flex w-fit items-center rounded-2xl bg-white px-5 py-3">
                            <Image
                                src="https://res.cloudinary.com/dqfvrpai8/image/upload/q_auto/f_auto/v1781429056/logo_opnmsj.png"
                                width={520}
                                height={170}
                                alt={siteConfig.name}
                                className="h-10 w-auto object-contain md:h-12"
                            />
                        </div>
                        <p className="mt-7 max-w-md text-2xl font-medium tracking-tight text-white/90 md:mt-8 md:text-4xl">
                            We turn ideas into brands that people remember.
                        </p>
                        <div className="mt-10 flex gap-3">
                            <SocialLink
                                href={siteConfig.socials.instagram}
                                label="Instagram"
                            >
                                <IconBrandInstagram size={18} />
                            </SocialLink>
                            <SocialLink
                                href={siteConfig.socials.linkedin}
                                label="LinkedIn"
                            >
                                <IconBrandLinkedin size={18} />
                            </SocialLink>
                            <SocialLink href={siteConfig.socials.x} label="X">
                                <IconBrandX size={18} />
                            </SocialLink>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10 md:col-span-7 md:grid-cols-3">
                        <FooterCol title="Studio">
                            {navLinks.map((l) => (
                                <FooterLink key={l.href} href={l.href}>
                                    {l.label}
                                </FooterLink>
                            ))}
                        </FooterCol>
                        <FooterCol title="Services">
                            {services.slice(0, 6).map((s) => (
                                <FooterLink
                                    key={s.slug}
                                    href={`/services#${s.slug}`}
                                >
                                    {s.title}
                                </FooterLink>
                            ))}
                        </FooterCol>
                        <FooterCol title="Contact">
                            <FooterLink href={`mailto:${siteConfig.email}`}>
                                {siteConfig.email}
                            </FooterLink>
                            <FooterLink href={siteConfig.whatsappUrl} external>
                                WhatsApp
                            </FooterLink>
                            <FooterLink href={siteConfig.calendly} external>
                                Book a Call
                            </FooterLink>
                        </FooterCol>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-6 border-t border-white/10 py-8 text-sm text-white/50 md:flex-row">
                    <span>
                        © {year} {siteConfig.name}. All rights reserved.
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em]">
                        From Draft. To Brand.
                    </span>
                </div>

                <div
                    aria-hidden
                    className="-mt-2 select-none pb-2 text-center text-[18vw] font-medium leading-none tracking-tighter text-white/[0.04] md:text-[14vw]"
                >
                    DRAFT TO BRAND
                </div>
            </div>
        </footer>
    );
}

function FooterCol({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
                {title}
            </h4>
            <ul className="flex flex-col gap-3 text-[15px] text-white/80">
                {children}
            </ul>
        </div>
    );
}

function FooterLink({
    href,
    children,
    external,
}: {
    href: string;
    children: React.ReactNode;
    external?: boolean;
}) {
    if (external) {
        return (
            <li>
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                >
                    {children}
                </a>
            </li>
        );
    }
    return (
        <li>
            <Link href={href} className="transition-colors hover:text-white">
                {children}
            </Link>
        </li>
    );
}

function SocialLink({
    href,
    label,
    children,
}: {
    href: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/80 transition-colors hover:bg-white hover:text-[#282a2a]"
        >
            {children}
        </a>
    );
}
