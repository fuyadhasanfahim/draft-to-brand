import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/shared/badge";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { CompareTable } from "@/components/pricing/compare-table";
import { Faq } from "@/components/pricing/faq";
import { HomeCta } from "@/components/home/cta";
import { Reveal } from "@/components/shared/animations";
import { SectionHeader } from "@/components/shared/section-header";

export const metadata: Metadata = {
  title: "Pricing — Plans & Retainers",
  description:
    "Three retainer tiers designed to match where your brand is today and where it's going next.",
};

export default function PricingPage() {
  return (
    <>
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-24">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]"
        />
        <Container>
          <div className="flex flex-col items-center text-center">
            <Reveal>
              <Badge>Pricing</Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="text-display mt-6 max-w-4xl text-5xl font-medium leading-[0.95] md:text-7xl lg:text-[88px]">
                Built for brands that
                <br />
                <span className="text-serif italic font-normal text-muted">
                  want to compound.
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
                Three retainer tiers. Senior team on every engagement. No lock-in,
                no junior hand-offs, no fluff.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="pb-12 md:pb-20">
        <Container>
          <PricingCards />
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <SectionHeader
            eyebrow="Compare"
            title={
              <>
                Choose the tier
                <br />
                <span className="text-serif italic font-normal text-muted">
                  that matches your moment.
                </span>
              </>
            }
          />
          <div className="mt-12">
            <CompareTable />
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <SectionHeader
            eyebrow="FAQ"
            title={
              <>
                Questions, before
                <br />
                <span className="text-serif italic font-normal text-muted">
                  the first call.
                </span>
              </>
            }
          />
          <div className="mt-12">
            <Faq />
          </div>
        </Container>
      </section>

      <HomeCta />
    </>
  );
}
