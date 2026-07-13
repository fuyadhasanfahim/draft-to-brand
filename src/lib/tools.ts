import { IconCalculator, IconClipboardCheck, type IconProps } from '@tabler/icons-react';
import type { ComponentType } from 'react';

export type Tool = {
    slug: string;
    title: string;
    summary: string;
    icon: ComponentType<IconProps>;
    category: string;
    preview: {
        tagline: string;
        stats: { value: string; label: string }[];
    };
};

export const tools: Tool[] = [
    {
        slug: 'pricing-calculator',
        title: 'Product Pricing Calculator',
        summary:
            'Plug in your product cost, delivery, return rate and margins, instantly get the price to sell at and the maximum ad cost-per-result that keeps you profitable.',
        icon: IconCalculator,
        category: 'E-commerce',
        preview: {
            tagline: 'Know your number before you spend it.',
            stats: [
                { value: '5', label: 'Quick steps' },
                { value: '2 min', label: 'To your price' },
            ],
        },
    },
    {
        slug: 'brand-audit-checklist',
        title: 'Brand Audit Checklist',
        summary:
            'Answer 15 quick questions about your page, content, ads and trust signals, get an instant brand health score and see exactly where the gaps are.',
        icon: IconClipboardCheck,
        category: 'Branding',
        preview: {
            tagline: 'See your brand the way customers do.',
            stats: [
                { value: '15', label: 'Quick questions' },
                { value: '2 min', label: 'To your score' },
            ],
        },
    },
];
