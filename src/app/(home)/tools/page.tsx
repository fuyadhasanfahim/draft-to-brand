import Link from 'next/link';
import { Container } from '@/components/shared/container';
import { Badge } from '@/components/shared/badge';
import { Reveal } from '@/components/shared/animations';
import { tools } from '@/lib/tools';
import { pageMetadata } from '@/lib/metadata';
import { IconArrowUpRight } from '@tabler/icons-react';

export const metadata = pageMetadata({
    title: 'Free Tools for Growing Brands',
    description:
        'Free calculators and utilities from Draft to Brand, built for founders running e-commerce and D2C brands in Bangladesh.',
    path: '/tools',
});

export default function ToolsPage() {
    return (
        <>
            <section className="relative isolate pt-36 pb-20 md:pt-44 md:pb-28">
                <div
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]"
                />
                <Container>
                    <Reveal>
                        <Badge>Free Tools</Badge>
                    </Reveal>
                    <Reveal delay={0.05}>
                        <h1 className="text-display mt-6 max-w-4xl text-4xl font-medium leading-[0.95] sm:text-5xl md:text-7xl">
                            Tools we built
                            <br />
                            <span className="text-serif italic font-normal text-muted">
                                for our clients, free for you.
                            </span>
                        </h1>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
                            No sign-up, no catch. Practical calculators and utilities we use with our own
                            clients, made free for any founder running a brand.
                        </p>
                    </Reveal>
                </Container>
            </section>

            <section className="pb-28 md:pb-36">
                <Container>
                    <div className="flex flex-col gap-6">
                        {tools.map((tool, i) => {
                            const accent = i % 2 === 0 ? '#ff3131' : '#282a2a';
                            return (
                                <Reveal key={tool.slug} delay={i * 0.06}>
                                    <Link
                                        href={`/tools/${tool.slug}`}
                                        className="group grid grid-cols-1 overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-background transition-colors hover:bg-surface md:grid-cols-5"
                                    >
                                        <div className="flex flex-col gap-5 p-7 md:col-span-2 md:gap-6 md:p-10">
                                            <span className="text-xs uppercase tracking-[0.18em] text-muted">
                                                {tool.category}
                                            </span>
                                            <div className="flex flex-col gap-3">
                                                <h3 className="text-display text-2xl font-medium leading-tight md:text-3xl">
                                                    {tool.title}
                                                </h3>
                                                <p className="text-[15px] leading-relaxed text-muted">
                                                    {tool.summary}
                                                </p>
                                            </div>
                                            <div className="mt-auto flex items-center gap-2 text-sm font-medium text-foreground">
                                                Use tool
                                                <IconArrowUpRight
                                                    size={16}
                                                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                                />
                                            </div>
                                        </div>
                                        <div
                                            className="relative isolate min-h-[220px] overflow-hidden md:col-span-3"
                                            style={{
                                                background:
                                                    accent === '#ff3131'
                                                        ? 'linear-gradient(135deg, #ff3131 0%, #c62525 60%, #7a1818 100%)'
                                                        : 'linear-gradient(135deg, #282a2a 0%, #1a1c1c 100%)',
                                            }}
                                        >
                                            <div
                                                aria-hidden
                                                className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22><circle cx=%221%22 cy=%221%22 r=%221%22 fill=%22white%22 opacity=%220.12%22/></svg>')]"
                                            />
                                            <div
                                                aria-hidden
                                                className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 rounded-full bg-white/10 blur-3xl transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="relative flex h-full flex-col justify-between p-7 text-white md:p-10">
                                                <div className="flex items-start justify-between">
                                                    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/70 backdrop-blur">
                                                        {tool.category}
                                                    </span>
                                                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition-transform group-hover:rotate-12">
                                                        <tool.icon size={18} stroke={1.7} />
                                                    </div>
                                                </div>

                                                <div className="mt-8">
                                                    <p className="text-serif max-w-xs text-xl italic leading-snug text-white/85 md:text-2xl">
                                                        {tool.preview.tagline}
                                                    </p>
                                                    <div className="mt-6 grid max-w-xs grid-cols-2 gap-3">
                                                        {tool.preview.stats.map((s) => (
                                                            <div
                                                                key={s.label}
                                                                className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur transition-transform duration-500 group-hover:-translate-y-0.5"
                                                            >
                                                                <div className="text-display text-2xl font-medium md:text-3xl">
                                                                    {s.value}
                                                                </div>
                                                                <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/60">
                                                                    {s.label}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </Reveal>
                            );
                        })}
                    </div>
                </Container>
            </section>
        </>
    );
}
