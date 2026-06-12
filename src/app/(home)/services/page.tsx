import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/shared/badge";
import { services } from "@/lib/data";
import { HomeCta } from "@/components/home/cta";
import { Reveal } from "@/components/shared/animations";
import { IconCheck } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Services — Brand, Growth & Performance",
  description:
    "A full-service studio for brand, content, paid media, SEO, web and growth systems.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="relative isolate pt-36 pb-20 md:pt-44 md:pb-28">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)]"
        />
        <Container>
          <Reveal>
            <Badge>Services</Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6 max-w-5xl text-5xl font-medium leading-[0.95] md:text-7xl lg:text-[88px]">
              Ten disciplines.
              <br />
              <span className="text-serif italic font-normal text-muted">
                One studio.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
              We're not a marketplace of freelancers. Every service below is
              delivered by a senior team that has lived inside the discipline
              for a decade — and we only take on engagements where we can lead
              with conviction.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-12 md:py-20">
        <Container>
          <div className="flex flex-col">
            {services.map((service, idx) => (
              <article
                key={service.slug}
                id={service.slug}
                className="grid scroll-mt-32 grid-cols-1 gap-8 border-t border-[color:var(--color-border)] py-14 md:grid-cols-12 md:gap-10 md:py-20"
              >
                <div className="flex flex-col gap-6 md:col-span-5">
                  <div className="flex items-center gap-4">
                    <span className="text-display text-5xl font-medium text-muted/30">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#282a2a] text-white">
                      <service.icon size={20} stroke={1.6} />
                    </div>
                  </div>
                  <h2 className="text-display text-3xl font-medium leading-tight md:text-4xl">
                    {service.title}
                  </h2>
                  <p className="text-lg leading-relaxed text-muted">
                    {service.summary}
                  </p>
                </div>
                <div className="md:col-span-7">
                  <div className="glass-card rounded-3xl p-7 md:p-9">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted">
                      What's included
                    </div>
                    <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                      {[
                        ...service.capabilities,
                        "Senior team",
                        "Weekly cadence",
                      ].map((c) => (
                        <li
                          key={c}
                          className="flex items-center gap-3 text-[15px]"
                        >
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ff3131]/10 text-[#ff3131]">
                            <IconCheck size={13} stroke={2.5} />
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <HomeCta />
    </>
  );
}
