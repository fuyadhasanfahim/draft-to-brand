import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/shared/container';
import { Badge } from '@/components/shared/badge';
import { Reveal } from '@/components/shared/animations';
import { tools } from '@/lib/tools';
import { pageMetadata } from '@/lib/metadata';
import { PricingCalculator } from '@/components/tools/pricing-calculator';

const toolComponents: Record<string, ComponentType> = {
    'pricing-calculator': PricingCalculator,
};

type Props = {
    params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
    return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const tool = tools.find((t) => t.slug === slug);
    if (!tool) return {};

    return pageMetadata({
        title: `${tool.title} — Free Tool`,
        description: tool.summary,
        path: `/tools/${tool.slug}`,
    });
}

export default async function ToolDetailPage({ params }: Props) {
    const { slug } = await params;
    const tool = tools.find((t) => t.slug === slug);
    const ToolComponent = toolComponents[slug];

    if (!tool || !ToolComponent) {
        notFound();
    }

    return (
        <>
            <section className="relative isolate pt-32 pb-12 md:pt-40 md:pb-16">
                <div
                    aria-hidden
                    className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]"
                />
                <Container>
                    <Reveal>
                        <Badge>{tool.category}</Badge>
                    </Reveal>
                    <Reveal delay={0.05}>
                        <h1 className="text-display mt-6 max-w-3xl text-3xl font-medium leading-[1.02] sm:text-4xl md:text-5xl">
                            {tool.title}
                        </h1>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{tool.summary}</p>
                    </Reveal>
                </Container>
            </section>

            <section className="pb-28 md:pb-36">
                <Container>
                    <ToolComponent />
                </Container>
            </section>
        </>
    );
}
