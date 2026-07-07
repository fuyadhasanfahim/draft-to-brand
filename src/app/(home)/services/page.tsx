import { Container } from "@/components/shared/container";
import { Badge } from "@/components/shared/badge";
import { services } from "@/lib/data";
import { HomeCta } from "@/components/home/cta";
import { Reveal } from "@/components/shared/animations";
import { IconCheck, IconArrowUpRight, IconStar } from "@tabler/icons-react";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Services: Brand, Growth & Performance",
  description:
    "A full-service studio for brand, content, paid media, SEO, web and growth systems.",
  path: "/services",
});

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
            <h1 className="text-display mt-6 max-w-5xl text-4xl font-medium leading-[0.95] sm:text-5xl md:text-7xl lg:text-[88px]">
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
              for a decade, and we only take on engagements where we can lead
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
                className={`grid scroll-mt-32 grid-cols-1 gap-8 border-t border-[color:var(--color-border)] py-14 md:grid-cols-12 md:gap-10 md:py-20 ${
                  service.featured
                    ? "relative -mx-6 rounded-3xl border-t-0 bg-[#282a2a] px-6 text-white md:-mx-10 md:px-10"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-6 md:col-span-5">
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-display text-5xl font-medium ${
                        service.featured ? "text-white/20" : "text-muted/30"
                      }`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-2xl ${
                        service.featured
                          ? "bg-[#ff3131] text-white"
                          : "bg-[#282a2a] text-white"
                      }`}
                    >
                      <service.icon size={20} stroke={1.6} />
                    </div>
                    {service.featured && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff3131]/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#ff3131]">
                        <IconStar size={12} stroke={2} />
                        Our Specialty
                      </span>
                    )}
                  </div>
                  <h2 className="text-display text-3xl font-medium leading-tight md:text-4xl">
                    {service.title}
                  </h2>
                  <p
                    className={`text-lg leading-relaxed ${
                      service.featured ? "text-white/70" : "text-muted"
                    }`}
                  >
                    {service.summary}
                  </p>
                  {service.portfolioUrl && (
                    <a
                      href={service.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-accent group w-fit"
                    >
                      View Portfolio
                      <IconArrowUpRight
                        size={18}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </a>
                  )}
                </div>
                <div className="md:col-span-7">
                  <div
                    className={
                      service.featured
                        ? "rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur md:p-9"
                        : "glass-card rounded-3xl p-7 md:p-9"
                    }
                  >
                    <div
                      className={`text-xs uppercase tracking-[0.18em] ${
                        service.featured ? "text-white/50" : "text-muted"
                      }`}
                    >
                      What's included
                    </div>
                    <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                      {service.capabilities.map((c) => (
                        <li
                          key={c}
                          className="flex items-center gap-3 text-[15px]"
                        >
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                              service.featured
                                ? "bg-[#ff3131]/20 text-[#ff3131]"
                                : "bg-[#ff3131]/10 text-[#ff3131]"
                            }`}
                          >
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
