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
};

export const services: Service[] = [
    {
        slug: 'brand-identity',
        title: 'Brand Identity & Strategy',
        summary:
            'Positioning, naming, visual systems and verbal identity that make brands unmistakable.',
        icon: IconSparkles,
        capabilities: [
            'Positioning',
            'Logo Systems',
            'Visual Identity',
            'Verbal Identity',
        ],
    },
    {
        slug: 'social-media',
        title: 'Social Media Marketing',
        summary:
            'Editorial-grade social strategy, content production and community building across every channel.',
        icon: IconShare,
        capabilities: [
            'Strategy',
            'Content Calendars',
            'Community',
            'Creator Partnerships',
        ],
    },
    {
        slug: 'content-marketing',
        title: 'Content Marketing',
        summary:
            'Long-form, short-form and editorial content engineered to rank, resonate and convert.',
        icon: IconCursorText,
        capabilities: [
            'Editorial',
            'Copywriting',
            'Video Scripts',
            'Distribution',
        ],
    },
    {
        slug: 'seo',
        title: 'Search Engine Optimization',
        summary:
            'Technical SEO, programmatic content and link strategy that compounds traffic over months.',
        icon: IconSearch,
        capabilities: [
            'Technical SEO',
            'On-Page',
            'Programmatic',
            'Link Building',
        ],
    },
    {
        slug: 'google-ads',
        title: 'Google Ads',
        summary:
            'Search, Performance Max and YouTube campaigns built around measurable acquisition cost.',
        icon: IconBrandGoogle,
        capabilities: ['Search', 'PMax', 'YouTube', 'Tracking'],
    },
    {
        slug: 'meta-ads',
        title: 'Meta Ads',
        summary:
            'Creative-led Meta advertising — testing frameworks, UGC, and full-funnel scaling.',
        icon: IconBrandMeta,
        capabilities: ['Creative Strategy', 'UGC', 'Retargeting', 'Scaling'],
    },
    {
        slug: 'web-design',
        title: 'Website Design & Development',
        summary:
            'Editorial websites and Next.js platforms designed to convert and outperform competitors.',
        icon: IconCode,
        capabilities: ['Next.js', 'Webflow', 'E-commerce', 'Conversion Design'],
    },
    {
        slug: 'automation',
        title: 'Marketing Automation',
        summary:
            'Lifecycle systems across email, SMS and CRM that turn one-time buyers into repeat revenue.',
        icon: IconRocket,
        capabilities: ['Lifecycle Email', 'CRM', 'SMS', 'Workflows'],
    },
    {
        slug: 'lead-gen',
        title: 'Lead Generation',
        summary:
            'Outbound, inbound and partnership pipelines that fill calendars with qualified meetings.',
        icon: IconChartBar,
        capabilities: [
            'Outbound',
            'Inbound',
            'Partnerships',
            'Sales Enablement',
        ],
    },
    {
        slug: 'cro',
        title: 'Conversion Optimization',
        summary:
            'Experiment programs and behavior research that lift conversion at every touchpoint.',
        icon: IconPaint,
        capabilities: [
            'Experimentation',
            'Research',
            'Analytics',
            'Funnel Design',
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
        result:
            'Within a few months of consistent, structured posting, the page saw steady growth in engagement and a real increase in DM inquiries converting into orders — giving the brand a repeatable content system it could run on its own going forward.',
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
        result:
            'A consistent content and ad system now runs every month, generating a steady flow of appointment inquiries straight from Facebook — with full performance visibility so strategy improves every cycle instead of running blind.',
        metrics: [
            { label: 'Monthly Appointment Inquiries', value: '[add actual figure]' },
            { label: 'Post Engagement Rate', value: '[add actual figure]' },
            { label: 'Meta Ad CTR', value: '[add actual figure]' },
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
        result:
            '[Describe the real outcome here — e.g. inbound DMs, speaking invites, client inquiries — once the engagement has run long enough to measure.]',
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
        industry: 'Interior Design Consultancy',
        year: '2024',
        title: 'A brand audit and pitch system for a growing design consultancy.',
        image: 'https://res.cloudinary.com/dqfvrpai8/image/upload/v1783246624/WhatsApp_Image_2026-07-05_at_4.15.55_PM_2_cyrixw.jpg',
        summary:
            'We ran a full brand audit and repositioning process for Sara Interior OPC, translating strong design work into a proposal system that could win bigger commercial clients.',
        challenge:
            'Sara Interior OPC had genuinely strong design capability, but no clear brand positioning and no repeatable way to pitch — every proposal was built from scratch, which slowed down client acquisition.',
        strategy:
            "We conducted a complete brand audit, refined the consultancy's core positioning and messaging, and built a reusable pitch and proposal framework — refined across multiple rounds directly with the founder, Naser Hossain, until it was tight enough to send with confidence.",
        result:
            'The consultancy came out with a clear brand story, a defined set of positioning pillars, and a proposal framework it can now reuse for every new pitch instead of starting from zero each time.',
        metrics: [
            { label: 'Brand Audit', value: 'Completed' },
            { label: 'Proposal Iterations', value: '4 Rounds' },
            { label: 'Positioning Pillars Defined', value: '3' },
        ],
        accent: '#ff3131',
    },
    {
        slug: 'graphic-design-studio-template',
        client: '[Graphic Design Studio Name]',
        industry: 'Graphic Design & Creative Studio',
        year: '2026',
        title: 'Giving a creative studio a portfolio and a pipeline, not just a portfolio.',
        summary:
            "We rebuilt [Studio Name]'s public-facing brand so great design work stopped living only in client DMs and started generating its own leads.",
        challenge:
            '[Studio Name] produced genuinely strong creative work but had no organized portfolio presence, no case-study structure, and relied entirely on referrals for new business.',
        strategy:
            'We restructured their best past work into proper case studies, built a consistent visual identity for their own brand (the "design studio\'s own design"), and set up a lightweight content calendar showing process, not just final output — which builds more trust with prospective clients than polished final shots alone.',
        result:
            '[Describe the real outcome here — e.g. inbound project inquiries, retainer clients signed, once this is a live engagement.]',
        metrics: [
            { label: 'Case Studies Built', value: '[add actual figure]' },
            { label: 'Inbound Project Inquiries', value: '[add actual figure]' },
            { label: 'Referral Dependency', value: '[before/after %]' },
        ],
        accent: '#282a2a',
    },
    {
        slug: 'halcyon',
        client: 'Halcyon Studio',
        industry: 'Architecture',
        year: '2025',
        title: 'Editorial identity for a boutique architecture practice.',
        summary:
            'Repositioning a regional practice into an internationally recognized design studio.',
        challenge:
            "Halcyon had award-winning work but a website that didn't reflect their craft, and zero pipeline outside referrals.",
        strategy:
            'Brand strategy refresh, editorial site, SEO foundations and a long-form content engine for AEC publications.',
        result: 'Inbound leads quadrupled and the studio was shortlisted for two international awards.',
        metrics: [
            { label: 'Qualified Inbound', value: '4.0×' },
            { label: 'Organic Traffic', value: '+512%' },
            { label: 'Avg Project Value', value: '+62%' },
        ],
        accent: '#282a2a',
    },
    {
        slug: 'lumen',
        client: 'Lumen Health',
        industry: 'HealthTech',
        year: '2024',
        title: 'A category-defining launch for preventive care.',
        summary:
            'We launched a preventive health platform from zero to 30,000 paying members in 14 months.',
        challenge:
            "A first-of-its-kind product in a category buyers didn't know existed yet.",
        strategy:
            'Category creation playbook — narrative-first content, founder-led media, performance creative and a referral engine.',
        result: '30,000 paying members, a Series A, and a press cycle that established the category.',
        metrics: [
            { label: 'Members', value: '30k' },
            { label: 'CAC Reduction', value: '−47%' },
            { label: 'Referral Share', value: '38%' },
        ],
        accent: '#ff3131',
    },
    {
        slug: 'atlas',
        client: 'Atlas Coffee Roasters',
        industry: 'Food & Beverage',
        year: '2024',
        title: 'From local roaster to national subscription brand.',
        summary:
            'A specialty roaster scaled subscriptions 7× through brand, content and lifecycle.',
        challenge:
            'Beautiful product, no recognizable brand, and subscription churn above 9%.',
        strategy:
            'We rebuilt the visual identity, launched an editorial blog and ran a lifecycle program tied to taste preferences.',
        result: 'Subscriptions grew 7× and monthly churn dropped to 3.2%.',
        metrics: [
            { label: 'Subscribers', value: '7×' },
            { label: 'Monthly Churn', value: '3.2%' },
            { label: 'LTV', value: '+184%' },
        ],
        accent: '#282a2a',
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
        price: '$4,800',
        cadence: 'per month',
        description:
            'For founders building momentum. A focused engagement on the channels that move the needle now.',
        features: [
            'Brand & messaging tune-up',
            'Two priority channels',
            'Up to 12 creatives per month',
            'Monthly strategy review',
            'Slack + email support',
        ],
        cta: 'Start with Starter',
    },
    {
        name: 'Growth',
        price: '$9,400',
        cadence: 'per month',
        description:
            'For brands scaling past $1M. Full-funnel growth across brand, content, paid and lifecycle.',
        features: [
            'Brand strategy + design system',
            'Four channels — paid + organic',
            'Up to 40 creatives per month',
            'Weekly growth standups',
            'Dedicated brand + growth lead',
            'Quarterly creative refresh',
        ],
        recommended: true,
        cta: 'Choose Growth',
    },
    {
        name: 'Scale',
        price: '$18,000+',
        cadence: 'per month',
        description:
            'For market leaders. A senior team embedded in your business, accountable to revenue.',
        features: [
            'Full marketing operating system',
            'Unlimited channels',
            'Unlimited creative scope',
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
    { label: 'Priority Channels', values: ['2', '4', 'Unlimited'] },
    { label: 'Creatives / month', values: ['12', '40', 'Unlimited'] },
    {
        label: 'Brand System',
        values: ['Tune-up', 'Full system', 'Operating system'],
    },
    {
        label: 'Strategy Cadence',
        values: ['Monthly', 'Weekly', 'Weekly + Quarterly'],
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
            year: '2019',
            title: 'Founded in a one-room studio.',
            description:
                'Two founders, a handful of clients, and a belief that brand and growth belong on the same team.',
        },
        {
            year: '2021',
            title: 'First international clients.',
            description:
                'Expanded across three continents and launched our editorial brand-strategy practice.',
        },
        {
            year: '2023',
            title: 'Performance & creative converge.',
            description:
                'Built an in-house performance studio so creative and media live under one roof.',
        },
        {
            year: '2025',
            title: 'Draft To Brand today.',
            description:
                'A 28-person senior team partnering with brands from seed to category leader.',
        },
    ];

export const values: { title: string; description: string }[] = [
    {
        title: 'Strategy first.',
        description:
            "Beautiful work that doesn't move the business isn't work we ship.",
    },
    {
        title: 'Senior, always.',
        description:
            'No junior hand-offs. The people in the pitch are the people on the project.',
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
