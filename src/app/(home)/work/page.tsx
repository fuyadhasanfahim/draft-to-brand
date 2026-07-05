import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/shared/badge";
import { caseStudies } from "@/lib/data";
import { Reveal } from "@/components/shared/animations";
import { HomeCta } from "@/components/home/cta";
import { ExpandableCard } from "@/components/shared/expandable-card";

export const metadata: Metadata = {
  title: "Work — Selected Case Studies",
  description:
    "Selected case studies from brands we've shaped from draft to category leader.",
};

export default function WorkPage() {
  return (
    <>
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28">
        <Container>
          <Reveal>
            <Badge>Selected Work</Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6 max-w-5xl text-4xl font-medium leading-[0.95] sm:text-5xl md:text-7xl lg:text-[88px]">
              Stories that
              <br />
              <span className="text-serif italic font-normal text-muted">
                compounded into categories.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
              Long engagements with ambitious teams. Each one started as a
              draft, became a brand, and is still compounding today.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="flex flex-col gap-32">
            {caseStudies.map((c, i) => (
              <article
                key={c.slug}
                id={c.slug}
                className="grid scroll-mt-32 grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16"
              >
                <div className="flex flex-col gap-6 lg:col-span-5">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
                    <span>{c.industry}</span>
                    <span>·</span>
                    <span>{c.year}</span>
                  </div>
                  <h2 className="text-display text-3xl font-medium leading-[1] sm:text-4xl md:text-5xl">
                    {c.title}
                  </h2>
                  <p className="text-lg leading-relaxed text-muted">
                    {c.summary}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-3 border-t border-[color:var(--color-border)] pt-6 md:gap-4">
                    {c.metrics.map((m) => (
                      <div key={m.label} className="min-w-0">
                        <div className="text-display text-2xl font-medium break-words md:text-4xl">
                          {m.value}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted md:text-[11px] md:tracking-[0.16em]">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div
                    className="group relative aspect-[4/3] overflow-hidden rounded-3xl"
                    style={{
                      background:
                        c.accent === "#ff3131"
                          ? `linear-gradient(135deg, #ff3131 0%, #c62525 50%, #7a1818 100%)`
                          : `linear-gradient(135deg, #282a2a 0%, #1a1c1c 100%)`,
                    }}
                  >
                    {c.image && (
                      <Image
                        src={c.image}
                        alt={c.title || `${c.industry} case study`}
                        fill
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        preload={i === 0}
                      />
                    )}
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22><circle cx=%221%22 cy=%221%22 r=%221%22 fill=%22white%22 opacity=%220.07%22/></svg>')]"
                    />
                    <div className="relative flex h-full flex-col justify-between p-8 text-white opacity-0 transition-all duration-500 ease-out group-hover:opacity-100 group-focus-within:opacity-100 [transform:translateY(10px)] group-hover:[transform:translateY(0)] group-focus-within:[transform:translateY(0)] md:p-12">
                      <div className="flex items-start justify-between">
                        <div className="text-display text-5xl font-medium leading-none">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white/80">
                          {c.industry}
                        </div>
                      </div>
                      <div>
                        <div className="text-serif text-3xl italic leading-tight text-white/80 sm:text-4xl md:text-6xl">
                          {c.industry}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 items-start gap-4 md:grid-cols-3">
                    {[
                      { label: "Challenge", body: c.challenge },
                      { label: "Strategy", body: c.strategy },
                      { label: "Result", body: c.result },
                    ].map((b) => (
                      <ExpandableCard key={b.label} label={b.label} body={b.body} />
                    ))}
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
