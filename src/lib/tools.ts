import { IconCalculator, type IconProps } from '@tabler/icons-react';
import type { ComponentType } from 'react';

export type Tool = {
    slug: string;
    title: string;
    summary: string;
    icon: ComponentType<IconProps>;
    category: string;
};

export const tools: Tool[] = [
    {
        slug: 'pricing-calculator',
        title: 'Product Pricing Calculator',
        summary:
            'Plug in your product cost, delivery, return rate and margins — instantly get the price to sell at and the maximum ad cost-per-result that keeps you profitable.',
        icon: IconCalculator,
        category: 'E-commerce',
    },
];
