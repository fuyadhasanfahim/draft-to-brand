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
} from "@tabler/icons-react";
import type { ComponentType } from "react";

export type Service = {
  slug: string;
  title: string;
  summary: string;
  icon: ComponentType<IconProps>;
  capabilities: string[];
};

export const services: Service[] = [
  {
    slug: "brand-identity",
    title: "Brand Identity & Strategy",
    summary:
      "Positioning, naming, visual systems and verbal identity that make brands unmistakable.",
    icon: IconSparkles,
    capabilities: ["Positioning", "Logo Systems", "Visual Identity", "Verbal Identity"],
  },
  {
    slug: "social-media",
    title: "Social Media Marketing",
    summary:
      "Editorial-grade social strategy, content production and community building across every channel.",
    icon: IconShare,
    capabilities: ["Strategy", "Content Calendars", "Community", "Creator Partnerships"],
  },
  {
    slug: "content-marketing",
    title: "Content Marketing",
    summary:
      "Long-form, short-form and editorial content engineered to rank, resonate and convert.",
    icon: IconCursorText,
    capabilities: ["Editorial", "Copywriting", "Video Scripts", "Distribution"],
  },
  {
    slug: "seo",
    title: "Search Engine Optimization",
    summary:
      "Technical SEO, programmatic content and link strategy that compounds traffic over months.",
    icon: IconSearch,
    capabilities: ["Technical SEO", "On-Page", "Programmatic", "Link Building"],
  },
  {
    slug: "google-ads",
    title: "Google Ads",
    summary:
      "Search, Performance Max and YouTube campaigns built around measurable acquisition cost.",
    icon: IconBrandGoogle,
    capabilities: ["Search", "PMax", "YouTube", "Tracking"],
  },
  {
    slug: "meta-ads",
    title: "Meta Ads",
    summary:
      "Creative-led Meta advertising — testing frameworks, UGC, and full-funnel scaling.",
    icon: IconBrandMeta,
    capabilities: ["Creative Strategy", "UGC", "Retargeting", "Scaling"],
  },
  {
    slug: "web-design",
    title: "Website Design & Development",
    summary:
      "Editorial websites and Next.js platforms designed to convert and outperform competitors.",
    icon: IconCode,
    capabilities: ["Next.js", "Webflow", "E-commerce", "Conversion Design"],
  },
  {
    slug: "automation",
    title: "Marketing Automation",
    summary:
      "Lifecycle systems across email, SMS and CRM that turn one-time buyers into repeat revenue.",
    icon: IconRocket,
    capabilities: ["Lifecycle Email", "CRM", "SMS", "Workflows"],
  },
  {
    slug: "lead-gen",
    title: "Lead Generation",
    summary:
      "Outbound, inbound and partnership pipelines that fill calendars with qualified meetings.",
    icon: IconChartBar,
    capabilities: ["Outbound", "Inbound", "Partnerships", "Sales Enablement"],
  },
  {
    slug: "cro",
    title: "Conversion Optimization",
    summary:
      "Experiment programs and behavior research that lift conversion at every touchpoint.",
    icon: IconPaint,
    capabilities: ["Experimentation", "Research", "Analytics", "Funnel Design"],
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
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "northwind",
    client: "Northwind Apparel",
    industry: "DTC Fashion",
    year: "2025",
    title: "Rebuilding a heritage label for the modern shopper.",
    summary:
      "We rebranded a 40-year-old fashion house and tripled their direct-to-consumer revenue in nine months.",
    challenge:
      "A legacy retail brand needed to reach a younger audience without alienating the loyal base that built the company.",
    strategy:
      "We rebuilt the visual identity, launched a high-conversion Next.js storefront, and ran a paid-social-led launch with creator partnerships.",
    result:
      "DTC revenue tripled in nine months and the brand was featured in three major publications.",
    metrics: [
      { label: "DTC Revenue Lift", value: "3.1×" },
      { label: "ROAS", value: "5.4×" },
      { label: "Email Revenue", value: "+218%" },
    ],
    accent: "#ff3131",
  },
  {
    slug: "halcyon",
    client: "Halcyon Studio",
    industry: "Architecture",
    year: "2025",
    title: "Editorial identity for a boutique architecture practice.",
    summary:
      "Repositioning a regional practice into an internationally recognized design studio.",
    challenge:
      "Halcyon had award-winning work but a website that didn't reflect their craft, and zero pipeline outside referrals.",
    strategy:
      "Brand strategy refresh, editorial site, SEO foundations and a long-form content engine for AEC publications.",
    result:
      "Inbound leads quadrupled and the studio was shortlisted for two international awards.",
    metrics: [
      { label: "Qualified Inbound", value: "4.0×" },
      { label: "Organic Traffic", value: "+512%" },
      { label: "Avg Project Value", value: "+62%" },
    ],
    accent: "#282a2a",
  },
  {
    slug: "lumen",
    client: "Lumen Health",
    industry: "HealthTech",
    year: "2024",
    title: "A category-defining launch for preventive care.",
    summary:
      "We launched a preventive health platform from zero to 30,000 paying members in 14 months.",
    challenge:
      "A first-of-its-kind product in a category buyers didn't know existed yet.",
    strategy:
      "Category creation playbook — narrative-first content, founder-led media, performance creative and a referral engine.",
    result:
      "30,000 paying members, a Series A, and a press cycle that established the category.",
    metrics: [
      { label: "Members", value: "30k" },
      { label: "CAC Reduction", value: "−47%" },
      { label: "Referral Share", value: "38%" },
    ],
    accent: "#ff3131",
  },
  {
    slug: "atlas",
    client: "Atlas Coffee Roasters",
    industry: "Food & Beverage",
    year: "2024",
    title: "From local roaster to national subscription brand.",
    summary:
      "A specialty roaster scaled subscriptions 7× through brand, content and lifecycle.",
    challenge:
      "Beautiful product, no recognizable brand, and subscription churn above 9%.",
    strategy:
      "We rebuilt the visual identity, launched an editorial blog and ran a lifecycle program tied to taste preferences.",
    result:
      "Subscriptions grew 7× and monthly churn dropped to 3.2%.",
    metrics: [
      { label: "Subscribers", value: "7×" },
      { label: "Monthly Churn", value: "3.2%" },
      { label: "LTV", value: "+184%" },
    ],
    accent: "#282a2a",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "Draft To Brand didn't just rebrand us — they reframed what our company stands for. The lift in conversion was immediate.",
    name: "Amelia Cross",
    role: "CMO",
    company: "Northwind Apparel",
  },
  {
    quote:
      "We finally have a website that matches the quality of our work. Inbound has quadrupled and the calibre of leads is a different league.",
    name: "Jordan Reyes",
    role: "Founder",
    company: "Halcyon Studio",
  },
  {
    quote:
      "The most strategic agency we've worked with. They think like a CMO, design like a studio, and execute like a performance team.",
    name: "Priya Mehta",
    role: "VP Growth",
    company: "Lumen Health",
  },
  {
    quote:
      "From positioning to lifecycle email, the work compounded month after month. Our LTV nearly tripled.",
    name: "Marcus Lin",
    role: "CEO",
    company: "Atlas Coffee Roasters",
  },
  {
    quote:
      "Editorial taste, operator-grade execution. They felt like an extension of our team from week one.",
    name: "Elena Voss",
    role: "Head of Brand",
    company: "Northstar Capital",
  },
  {
    quote:
      "They take brand seriously in a way most agencies don't. Every deliverable felt considered, calm, and intentional.",
    name: "Daniel Park",
    role: "Founder",
    company: "Soma Wellness",
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
    name: "Starter",
    price: "$4,800",
    cadence: "per month",
    description:
      "For founders building momentum. A focused engagement on the channels that move the needle now.",
    features: [
      "Brand & messaging tune-up",
      "Two priority channels",
      "Up to 12 creatives per month",
      "Monthly strategy review",
      "Slack + email support",
    ],
    cta: "Start with Starter",
  },
  {
    name: "Growth",
    price: "$9,400",
    cadence: "per month",
    description:
      "For brands scaling past $1M. Full-funnel growth across brand, content, paid and lifecycle.",
    features: [
      "Brand strategy + design system",
      "Four channels — paid + organic",
      "Up to 40 creatives per month",
      "Weekly growth standups",
      "Dedicated brand + growth lead",
      "Quarterly creative refresh",
    ],
    recommended: true,
    cta: "Choose Growth",
  },
  {
    name: "Scale",
    price: "$18,000+",
    cadence: "per month",
    description:
      "For market leaders. A senior team embedded in your business, accountable to revenue.",
    features: [
      "Full marketing operating system",
      "Unlimited channels",
      "Unlimited creative scope",
      "Embedded senior team",
      "On-site quarterly workshops",
      "Direct line to founders",
      "Custom analytics + reporting",
    ],
    cta: "Talk to Founders",
  },
];

export const compareRows: { label: string; values: [string, string, string] }[] =
  [
    { label: "Dedicated Strategist", values: ["—", "✓", "Senior"] },
    { label: "Priority Channels", values: ["2", "4", "Unlimited"] },
    { label: "Creatives / month", values: ["12", "40", "Unlimited"] },
    { label: "Brand System", values: ["Tune-up", "Full system", "Operating system"] },
    { label: "Strategy Cadence", values: ["Monthly", "Weekly", "Weekly + Quarterly"] },
    { label: "Analytics & Reporting", values: ["Standard", "Custom", "Custom + BI"] },
    { label: "On-site Workshop", values: ["—", "—", "Quarterly"] },
    { label: "Founders' Line", values: ["—", "—", "Direct"] },
  ];

export const faqs: { q: string; a: string }[] = [
  {
    q: "How long is a typical engagement?",
    a: "Most clients start on a three-month foundation and roll into a quarterly retainer. We don't believe in lock-in — only in compounding work.",
  },
  {
    q: "Do you work with early-stage companies?",
    a: "Yes, with the right fit. We work with founders who treat brand and marketing as a strategic function, not a line item.",
  },
  {
    q: "Can we engage you for a single project?",
    a: "We take on a limited number of project engagements per quarter — usually rebrands, launches or website builds. Reach out and we'll tell you honestly if there's a fit.",
  },
  {
    q: "Which industries do you specialize in?",
    a: "We do our best work with DTC, healthtech, B2B SaaS, hospitality and design-led professional services.",
  },
  {
    q: "How do you measure success?",
    a: "Revenue, pipeline and brand equity — measured against the goals we agree on in week one. Every retainer has a scorecard.",
  },
];

export const processSteps: { number: string; title: string; description: string }[] =
  [
    {
      number: "01",
      title: "Discovery",
      description:
        "We start with the business. Goals, constraints, audience, market — the truth, not the pitch.",
    },
    {
      number: "02",
      title: "Strategy",
      description:
        "We translate insight into a positioning, brand and growth strategy with sharp, defensible decisions.",
    },
    {
      number: "03",
      title: "Design & Build",
      description:
        "Editorial design, performance-grade engineering and considered craft across every surface.",
    },
    {
      number: "04",
      title: "Launch",
      description:
        "A coordinated launch across earned, owned and paid — built for momentum, not noise.",
    },
    {
      number: "05",
      title: "Compound",
      description:
        "Weekly experiments and quarterly resets — the same team, getting sharper every month.",
    },
  ];

export const timeline: { year: string; title: string; description: string }[] = [
  {
    year: "2019",
    title: "Founded in a one-room studio.",
    description:
      "Two founders, a handful of clients, and a belief that brand and growth belong on the same team.",
  },
  {
    year: "2021",
    title: "First international clients.",
    description:
      "Expanded across three continents and launched our editorial brand-strategy practice.",
  },
  {
    year: "2023",
    title: "Performance & creative converge.",
    description:
      "Built an in-house performance studio so creative and media live under one roof.",
  },
  {
    year: "2025",
    title: "Draft To Brand today.",
    description:
      "A 28-person senior team partnering with brands from seed to category leader.",
  },
];

export const values: { title: string; description: string }[] = [
  {
    title: "Strategy first.",
    description:
      "Beautiful work that doesn't move the business isn't work we ship.",
  },
  {
    title: "Senior, always.",
    description:
      "No junior hand-offs. The people in the pitch are the people on the project.",
  },
  {
    title: "Editorial taste.",
    description:
      "We believe craft is a competitive advantage and we treat it that way.",
  },
  {
    title: "Operator's mindset.",
    description:
      "We've sat in your seat. We think in pipelines, margins and revenue.",
  },
];
