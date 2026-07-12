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
        'Free calculators and utilities from Draft to Brand — built for founders running e-commerce and D2C brands in Bangladesh.',
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
                                for our clients — free for you.
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
                    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] md:grid-cols-2 lg:grid-cols-3">
                        {tools.map((tool) => (
                            <Link
                                href={`/tools/${tool.slug}`}
                                key={tool.slug}
                                className="group relative flex flex-col gap-5 bg-background p-7 transition-colors hover:bg-surface md:gap-6 md:p-10"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                                        {tool.category}
                                    </span>
                                    <div className="grid h-11 w-11 place-items-center rounded-full bg-[#282a2a] text-white transition-transform group-hover:rotate-12">
                                        <tool.icon size={18} stroke={1.7} />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <h3 className="text-display text-2xl font-medium leading-tight md:text-3xl">
                                        {tool.title}
                                    </h3>
                                    <p className="text-[15px] leading-relaxed text-muted">{tool.summary}</p>
                                </div>
                                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-foreground">
                                    Use tool
                                    <IconArrowUpRight
                                        size={16}
                                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    />
                                </div>
                            </Link>
                        ))}
                    </div>
                </Container>
            </section>
        </>
    );
}
