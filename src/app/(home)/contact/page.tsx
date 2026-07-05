import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/shared/badge";
import { Reveal } from "@/components/shared/animations";
import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/lib/site";
import {
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconMail,
  IconArrowUpRight,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Contact — Let's Begin",
  description:
    "Book a discovery call, send us a message, or message us on WhatsApp.",
};

export default function ContactPage() {
  return (
    <>
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]"
        />
        <Container>
          <Reveal>
            <Badge>Let's talk</Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6 max-w-5xl text-4xl font-medium leading-[0.95] sm:text-5xl md:text-7xl lg:text-[88px]">
              Tell us about
              <br />
              <span className="text-serif italic font-normal text-muted">
                your brand.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
              A senior partner reads every inquiry and replies within one
              business day.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="pb-24 md:pb-32">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-5">
              <CtaCard
                icon={<IconCalendarEvent size={20} />}
                label="Book a discovery call"
                title="30 minutes with a partner."
                description="Pick a time that works — we'll come prepared with a take on your moment."
                href={siteConfig.calendly}
                external
                accent
              />
              <CtaCard
                icon={<IconBrandWhatsapp size={20} />}
                label="WhatsApp"
                title="Message us directly."
                description="Quick questions, async timezones — we're on WhatsApp during business hours."
                href={siteConfig.whatsappUrl}
                external
              />
              <CtaCard
                icon={<IconMail size={20} />}
                label="Email"
                title={siteConfig.email}
                description="For RFPs and detailed briefs, email reaches us fastest."
                href={`mailto:${siteConfig.email}`}
              />
            </div>

            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function CtaCard({
  icon,
  label,
  title,
  description,
  href,
  external,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  href: string;
  external?: boolean;
  accent?: boolean;
}) {
  const inner = (
    <div
      className={`group flex items-start gap-5 rounded-3xl p-6 transition-all md:p-7 ${
        accent
          ? "bg-[#282a2a] text-white hover:-translate-y-0.5"
          : "glass-card hover:-translate-y-0.5"
      }`}
    >
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
          accent ? "bg-[#ff3131] text-white" : "bg-[#282a2a] text-white"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span
          className={`text-xs uppercase tracking-[0.18em] ${
            accent ? "text-white/60" : "text-muted"
          }`}
        >
          {label}
        </span>
        <span className="text-display text-xl font-medium leading-tight">
          {title}
        </span>
        <span
          className={`text-sm leading-relaxed ${
            accent ? "text-white/70" : "text-muted"
          }`}
        >
          {description}
        </span>
      </div>
      <IconArrowUpRight
        size={20}
        className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  return <Link href={href}>{inner}</Link>;
}
