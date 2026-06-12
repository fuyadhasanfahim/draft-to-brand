import Link from "next/link";
import { Container } from "../shared/container";
import { SectionHeader } from "../shared/section-header";
import { services } from "@/lib/data";
import { IconArrowUpRight } from "@tabler/icons-react";
import { Reveal } from "../shared/animations";

export function ServicesPreview() {
  return (
    <section className="py-28 md:py-36">
      <Container>
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            eyebrow="What we do"
            title={
              <>
                A studio for brand,
                <br />
                <span className="text-serif italic font-normal text-muted">
                  growth & everything in between.
                </span>
              </>
            }
          />
          <Reveal delay={0.15}>
            <Link
              href="/services"
              className="btn-ghost text-base"
            >
              All services <IconArrowUpRight size={16} />
            </Link>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] md:grid-cols-2 lg:grid-cols-3">
          {services.slice(0, 6).map((service, idx) => (
            <Link
              href={`/services#${service.slug}`}
              key={service.slug}
              className="group relative flex flex-col gap-6 bg-background p-8 transition-colors hover:bg-surface md:p-10"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.18em] text-muted">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#282a2a] text-white transition-transform group-hover:rotate-12">
                  <service.icon size={18} stroke={1.7} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-display text-2xl font-medium leading-tight md:text-3xl">
                  {service.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted">
                  {service.summary}
                </p>
              </div>
              <div className="mt-auto flex items-center gap-2 text-sm font-medium text-foreground">
                Read more
                <IconArrowUpRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
