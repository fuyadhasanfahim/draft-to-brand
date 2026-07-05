import {
    IconBrandGoogle,
    IconBrandMeta,
    IconChartBar,
    IconCode,
    IconCursorText,
    IconPaint,
    IconRocket,
    IconSearch,
    IconShare,
    IconSparkles,
    type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

export type Service = {
    slug: string;
    title: string;
    summary: string;
    icon: ComponentType<IconProps>;
    capabilities: string[];
    featured?: boolean;
    portfolioUrl?: string;
};

export const services: Service[] = [
    {
        slug: 'web-design',
        title: 'Website Design & Development',
        summary:
            'Editorial-grade websites and Next.js builds engineered to load fast, convert visitors, and outperform the template-built sites your competitors are still running.',
        icon: IconCode,
        capabilities: [
            'Next.js Development',
            'Webflow Builds',
            'E-commerce Integration',
            'Conversion-Focused UX',
            'Page Speed Optimization',
            'Post-Launch Support',
        ],
        featured: true,
        portfolioUrl: 'https://fuyadhasanfahim.com/projects',
    },
    {
        slug: 'brand-identity',
        title: 'Brand Identity & Strategy',
        summary:
            'We build the strategic foundation before a single pixel is designed — positioning that holds up under competitive scrutiny, naming cleared for cultural and legal fit, and visual systems built to outlast trend cycles, not chase them.',
        icon: IconSparkles,
        capabilities: [
            'Positioning & Naming',
            'Logo & Visual Systems',
            'Verbal Identity & Tone of Voice',
            'Brand Guidelines',
            'Competitor & Market Research',
            'Launch Toolkit',
        ],
    },
    {
        slug: 'social-media',
        title: 'Social Media Marketing',
        summary:
            'Editorial-grade strategy and channel-native production that builds an owned community — not one that evaporates the day you stop boosting posts.',
        icon: IconShare,
        capabilities: [
            'Channel Strategy',
            'Content Calendars',
            'Community Management',
            'Creator Partnerships',
            'Platform-Native Production',
            'Monthly Performance Reviews',
        ],
    },
    {
        slug: 'content-marketing',
        title: 'Content Marketing',
        summary:
            'Long-form and short-form content engineered around how your audience actually searches, scrolls, and decides — built to rank and convert, not just fill a calendar.',
        icon: IconCursorText,
        capabilities: [
            'Editorial Strategy',
            'Copywriting',
            'Video Scripts',
            'Distribution Planning',
            'SEO-Aligned Publishing',
            'Content Performance Audits',
        ],
    },
    {
        slug: 'seo',
        title: 'Search Engine Optimization',
        summary:
            'Technical fixes, programmatic content, and link strategy built to compound month over month — not a one-time audit that goes stale the day we deliver it.',
        icon: IconSearch,
        capabilities: [
            'Technical SEO',
            'On-Page Optimization',
            'Programmatic Content',
            'Link Building',
            'Site Architecture',
            'Quarterly Ranking Reports',
        ],
    },
    {
        slug: 'google-ads',
        title: 'Google Ads',
        summary:
            'Search, Performance Max, and YouTube campaigns structured around cost-per-acquisition — not impressions that look good in a screenshot and mean nothing on the P&L.',
        icon: IconBrandGoogle,
        capabilities: [
            'Search Campaigns',
            'Performance Max',
            'YouTube Ads',
            'Conversion Tracking',
            'Bid Strategy Management',
            'Budget Pacing Reports',
        ],
    },
    {
        slug: 'meta-ads',
        title: 'Meta Ads',
        summary:
            'Creative-led Meta advertising with structured testing frameworks and UGC pipelines built to scale past one lucky winning ad.',
        icon: IconBrandMeta,
        capabilities: [
            'Creative Strategy',
            'Testing Frameworks',
            'UGC Production',
            'Retargeting',
            'Scaling Strategy',
            'Weekly Optimization Reports',
        ],
    },
    {
        slug: 'automation',
        title: 'Marketing Automation',
        summary:
            'Lifecycle systems across email, SMS, and CRM that turn a one-time buyer into repeat revenue — running quietly in the background instead of relying on manual follow-up.',
        icon: IconRocket,
        capabilities: [
            'Lifecycle Email',
            'SMS Flows',
            'CRM Setup & Management',
            'Workflow Automation',
            'Audience Segmentation',
            'Revenue Attribution Reporting',
        ],
    },
    {
        slug: 'lead-gen',
        title: 'Lead Generation',
        summary:
            'Outbound, inbound, and partnership pipelines engineered to fill your calendar with qualified meetings — not warm leads that ghost after one email.',
        icon: IconChartBar,
        capabilities: [
            'Outbound Prospecting',
            'Inbound Capture',
            'Partnership Pipelines',
            'Sales Enablement',
            'Lead Scoring',
            'Pipeline Reporting',
        ],
    },
    {
        slug: 'cro',
        title: 'Conversion Optimization',
        summary:
            'Structured experimentation and behavioral research that lift conversion at every step of the funnel — decisions backed by data, not internal opinion.',
        icon: IconPaint,
        capabilities: [
            'A/B Testing',
            'Behavioral Research',
            'Funnel Analysis',
            'Heatmaps & Session Recordings',
            'Funnel Redesign',
            'Experiment Roadmaps',
        ],
    },
];

export type CaseStudy = {
    slug: string;
    client: string;
    industry: string;
    year: string;
    title: string;
    summary: string;
    challenge: string;
    strategy: string;
    result: string;
    metrics: { label: string; value: string }[];
    accent: string;
    image?: string;
};

export const caseStudies: CaseStudy[] = [
    {
        slug: 'an-nisas-world',
        client: "An Nisa's World",
        industry: "Women's Fashion & Embroidery",
        year: '2024',
        title: 'Turning an offline reputation into an active online storefront.',
        image: 'https://res.cloudinary.com/dqfvrpai8/image/upload/v1783246623/WhatsApp_Image_2026-07-05_at_4.15.55_PM_3_asyhuk.jpg',
        summary:
            "We built An Nisa's World's social media presence from the ground up — turning decades of offline trust into a consistent, order-generating online channel.",
        challenge:
            "An Nisa's World had a loyal customer base built over years of word-of-mouth, but almost no organized digital presence — inconsistent posting, no content calendar, and no clear brand voice across platforms.",
        strategy:
            'We built a structured bilingual content calendar mixing product storytelling, behind-the-scenes embroidery process content, and direct-response posts designed to move followers into DMs rather than passive scrolling. Every post followed a consistent visual and tonal identity.',
        result: 'Within a few months of consistent, structured posting, the page saw steady growth in engagement and a real increase in DM inquiries converting into orders — giving the brand a repeatable content system it could run on its own going forward.',
        metrics: [
            { label: 'Page Engagement', value: '+140%' },
            { label: 'Monthly DM Inquiries', value: '3.2×' },
            { label: 'Follower Growth', value: '+65%' },
        ],
        accent: '#ff3131',
    },
    {
        slug: 'ultimate-tooth-station',
        client: 'The Ultimate Tooth Station',
        industry: 'Dental & Prosthodontic Care',
        year: '2025',
        title: 'From zero online presence to a steady stream of booked patients.',
        image: 'https://res.cloudinary.com/dqfvrpai8/image/upload/v1783246623/WhatsApp_Image_2026-07-05_at_4.15.55_PM_eik0jn.jpg',
        summary:
            "We built Dr. S. M. Forhad Arefin's entire digital presence from scratch — bios, content, ads, and reporting — turning clinical credibility into consistent appointment bookings.",
        challenge:
            'Dr. Arefin had strong clinical reputation as a prosthodontist but no digital footprint at all — no bios, no content system, no ad strategy, and no way for prospective patients to discover or book him online.',
        strategy:
            'We built the complete setup from the ground up: professional bios, a bilingual (Bengali + English) content calendar mixing educational, storytelling, and CTA-driven posts, and a simple comment-keyword system ("BOOK", "APPOINTMENT", "CHECKUP") that turned curious readers into direct leads. This was backed by targeted Meta ad campaigns and a monthly performance report to keep refining what worked.',
        result: 'A consistent content and ad system now runs every month, generating a steady flow of appointment inquiries straight from Facebook — with full performance visibility so strategy improves every cycle instead of running blind.',
        metrics: [
            { label: 'Monthly Appointment Inquiries', value: '45+' },
            { label: 'Post Engagement Rate', value: '6.8%' },
            { label: 'Meta Ad CTR', value: '3.1%' },
        ],
        accent: '#282a2a',
    },
    {
        slug: 'personal-brand-template',
        client: '[Client Name]',
        industry: 'Personal Branding / Thought Leadership',
        year: '2026',
        title: "Building a recognizable personal brand from a founder's existing expertise.",
        image: 'https://res.cloudinary.com/dqfvrpai8/image/upload/v1783246623/WhatsApp_Image_2026-07-05_at_4.15.55_PM_1_jdpjsf.jpg',
        summary:
            "We turned [Client Name]'s real-world expertise into a consistent personal brand presence — content that built trust before a single sales conversation happened.",
        challenge:
            '[Client Name] had deep expertise and credibility offline but no structured way to show it online — inconsistent posting, no clear point of view, and no system to turn visibility into inbound opportunities.',
        strategy:
            'We defined a core content pillar structure (expertise, behind-the-scenes, opinion), built a posting calendar across LinkedIn and Facebook, and wrote in a consistent first-person voice designed to start conversations, not just collect likes.',
        result: '[Describe the real outcome here — e.g. inbound DMs, speaking invites, client inquiries — once the engagement has run long enough to measure.]',
        metrics: [
            { label: 'Content Pillars Defined', value: '3' },
            { label: 'Posting Consistency', value: '10' },
            { label: 'Inbound Inquiries', value: '4' },
        ],
        accent: '#282a2a',
    },
    {
        slug: 'sara-interior-opc',
        client: 'Sara Interior OPC',
        industry: 'Graphic Design Consultancy',
        year: '2024',
        title: 'A brand audit and pitch system for a growing design consultancy.',
        image: 'https://res.cloudinary.com/dqfvrpai8/image/upload/v1783246624/WhatsApp_Image_2026-07-05_at_4.15.55_PM_2_cyrixw.jpg',
        summary:
            'We ran a full brand audit and repositioning process for Sara Interior OPC, translating strong design work into a proposal system that could win bigger commercial clients.',
        challenge:
            'Sara Interior OPC had genuinely strong design capability, but no clear brand positioning and no repeatable way to pitch — every proposal was built from scratch, which slowed down client acquisition.',
        strategy:
            "We conducted a complete brand audit, refined the consultancy's core positioning and messaging, and built a reusable pitch and proposal framework — refined across multiple rounds directly with the founder, Naser Hossain, until it was tight enough to send with confidence.",
        result: 'The consultancy came out with a clear brand story, a defined set of positioning pillars, and a proposal framework it can now reuse for every new pitch instead of starting from zero each time.',
        metrics: [
            { label: 'Brand Audit', value: 'Completed' },
            { label: 'Proposal Iterations', value: '4 Rounds' },
            { label: 'Positioning Pillars Defined', value: '3' },
        ],
        accent: '#ff3131',
    },
];

export type Testimonial = {
    quote: string;
    name: string;
    role: string;
};

export const testimonials: Testimonial[] = [
    {
        quote: "Draft To Brand didn't just rebrand us — they reframed what our company stands for. The lift in conversion was immediate.",
        name: 'Sabid Khan',
        role: 'Client',
    },
    {
        quote: 'We finally have a website that matches the quality of our work. Inbound has quadrupled and the calibre of leads is a different league.',
        name: 'Masum Kamal',
        role: 'Client',
    },
    {
        quote: "The most strategic team we've worked with. They think like a CMO, design like a studio, and execute like a performance team.",
        name: 'Fuyad Hasan Fahim',
        role: 'Client',
    },
    {
        quote: 'From positioning to lifecycle email, the work compounded month after month. Our LTV nearly tripled.',
        name: 'Md. Safiq',
        role: 'Client',
    },
    {
        quote: 'Editorial taste, operator-grade execution. They felt like an extension of our team from week one.',
        name: 'Dr. S.M. Arefin',
        role: 'Client',
    },
    {
        quote: "They take brand seriously in a way most agencies don't. Every deliverable felt considered, calm, and intentional.",
        name: 'Md. Jubayer Hossain',
        role: 'Client',
    },
];

export type Pricing = {
    name: string;
    price: string;
    cadence: string;
    description: string;
    features: string[];
    recommended?: boolean;
    cta: string;
};

export const pricing: Pricing[] = [
    {
        name: 'Starter',
        price: '$347',
        cadence: 'per month',
        description:
            'For founders building momentum. A focused engagement on the channels that move the needle now.',
        features: [
            'Brand & messaging tune-up',
            'Social Media Optimization',
            'One priority channel',
            'Up to 12 creatives per month',
            'Monthly strategy review',
        ],
        cta: 'Start with Starter',
    },
    {
        name: 'Growth',
        price: '$847',
        cadence: 'per month',
        description:
            'For brands scaling past $1M. Full-funnel growth across brand, content, paid and lifecycle.',
        features: [
            'Brand strategy + design system',
            'Three channels, paid + organic',
            'Up to 27 creatives per month',
            'Monthly growth standups',
            'Dedicated brand + growth lead',
            'Quarterly creative refresh',
        ],
        recommended: true,
        cta: 'Choose Growth',
    },
    {
        name: 'Scale',
        price: '$1,547',
        cadence: 'per month',
        description:
            'For market leaders. A senior team embedded in your business, accountable to revenue.',
        features: [
            'Full marketing operating system',
            'Five channels',
            '47 creatives per month',
            'Embedded senior team',
            'On-site quarterly workshops',
            'Direct line to founders',
            'Custom analytics + reporting',
        ],
        cta: 'Talk to Founders',
    },
];

export const compareRows: {
    label: string;
    values: [string, string, string];
}[] = [
    { label: 'Dedicated Strategist', values: ['—', '✓', 'Senior'] },
    { label: 'Priority Channels', values: ['1', '3', '5'] },
    { label: 'Creatives / month', values: ['12', '27', '47'] },
    {
        label: 'Brand System',
        values: ['Tune-up', 'Full system', 'Operating system'],
    },
    {
        label: 'Strategy Cadence',
        values: ['Monthly', 'Monthly', 'Weekly + Quarterly'],
    },
    {
        label: 'Analytics & Reporting',
        values: ['Standard', 'Custom', 'Custom + BI'],
    },
    { label: 'On-site Workshop', values: ['—', '—', 'Quarterly'] },
    { label: "Founders' Line", values: ['—', '—', 'Direct'] },
];

export const faqs: { q: string; a: string }[] = [
    {
        q: 'How long is a typical engagement?',
        a: "Most clients start on a three-month foundation and roll into a quarterly retainer. We don't believe in lock-in — only in compounding work.",
    },
    {
        q: 'Do you work with early-stage companies?',
        a: 'Yes, with the right fit. We work with founders who treat brand and marketing as a strategic function, not a line item.',
    },
    {
        q: 'Can we engage you for a single project?',
        a: "We take on a limited number of project engagements per quarter — usually rebrands, launches or website builds. Reach out and we'll tell you honestly if there's a fit.",
    },
    {
        q: 'Which industries do you specialize in?',
        a: 'We do our best work with DTC, healthtech, B2B SaaS, hospitality and design-led professional services.',
    },
    {
        q: 'How do you measure success?',
        a: 'Revenue, pipeline and brand equity — measured against the goals we agree on in week one. Every retainer has a scorecard.',
    },
];

export const processSteps: {
    number: string;
    title: string;
    description: string;
}[] = [
    {
        number: '01',
        title: 'Discovery',
        description:
            'We start with the business. Goals, constraints, audience, market — the truth, not the pitch.',
    },
    {
        number: '02',
        title: 'Strategy',
        description:
            'We translate insight into a positioning, brand and growth strategy with sharp, defensible decisions.',
    },
    {
        number: '03',
        title: 'Design & Build',
        description:
            'Editorial design, performance-grade engineering and considered craft across every surface.',
    },
    {
        number: '04',
        title: 'Launch',
        description:
            'A coordinated launch across earned, owned and paid — built for momentum, not noise.',
    },
    {
        number: '05',
        title: 'Compound',
        description:
            'Weekly experiments and quarterly resets — the same team, getting sharper every month.',
    },
];

export const timeline: { year: string; title: string; description: string }[] =
    [
        {
            year: '2024',
            title: 'Founded, one founder, one laptop.',
            description:
                'Draft to Brand started as an independent practice in Gaibandha — a single founder handling strategy, content, and client work directly, with a belief that small businesses deserved agency-grade marketing.',
        },
        {
            year: '2025',
            title: 'First flagship clients, real systems.',
            description:
                'Onboarded our first anchor clients across healthcare and IT — building full social media systems, Meta Ads strategy, and reporting pipelines from the ground up, including Bengali-language content and professional client reporting.',
        },
        {
            year: '2026',
            title: 'Draft to Brand today.',
            description:
                'A growing studio running live accounts across dental, IT, and e-commerce clients — with a hybrid pricing model, a telemarketing playbook for local businesses, and a working process for strategy, content, and paid media under one team.',
        },
    ];

export const values: { title: string; description: string }[] = [
    {
        title: 'Strategy before design.',
        description:
            "Beautiful work that doesn't move the business isn't work we ship.",
    },
    {
        title: 'One team, start to finish.',
        description:
            'The person who audits your business is the same one running your ads and reporting the results.',
    },
    {
        title: 'Editorial taste.',
        description:
            'We believe craft is a competitive advantage and we treat it that way.',
    },
    {
        title: "Operator's mindset.",
        description:
            "We've sat in your seat. We think in pipelines, margins and revenue.",
    },
];
