import { Container } from "@/components/shared/container";
import { Badge } from "@/components/shared/badge";
import { Reveal } from "@/components/shared/animations";
import { SectionHeader } from "@/components/shared/section-header";
import { timeline, values, processSteps } from "@/lib/data";
import { HomeCta } from "@/components/home/cta";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About: Our Studio",
  description:
    "Draft To Brand is a digital marketing and brand management studio. We consult a brand from draft to brand.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <section className="relative pt-36 pb-20 md:pt-44 md:pb-28">
        <Container>
          <Reveal>
            <Badge>About the studio</Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6 max-w-5xl text-4xl font-medium leading-[0.95] sm:text-5xl md:text-7xl lg:text-[96px]">
              A studio that
              <br />
              <span className="text-serif italic font-normal text-muted">
                consults a brand
              </span>
              <br />
              from draft to a brand.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
              Draft to Brand is a digital marketing and brand management studio based in Bangladesh. We work with clinics, IT firms, and local businesses that are done improvising, and ready to grow with a plan.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Mission / Vision */}
      <section className="py-20 md:py-28">
        <Container>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                label: "Mission",
                title: "Turn drafts into brands worth remembering.",
                body: "We exist for the founders and CMOs who refuse to settle for ordinary work. Our mission is to bring strategic clarity, editorial taste and operator execution to every brand we touch.",
              },
              {
                label: "Vision",
                title: "Brand is the longest-compounding asset.",
                body: "We believe brand and growth are one discipline, not two. Companies that treat them as such will outpace the rest of the decade.",
              },
              {
                label: "Promise",
                title: "One team. Honest numbers. Work you can check.",
                body: "No juniors quietly running your account. Every report is real, the same person who plans your strategy is the one reporting on what it actually did.",
              },
            ].map((b) => (
              <div
                key={b.label}
                className="flex flex-col gap-5 rounded-3xl border border-[color:var(--color-border)] bg-white p-7 md:p-10"
              >
                <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-primary-text)]">
                  {b.label}
                </span>
                <h3 className="text-display text-2xl font-medium leading-tight md:text-3xl">
                  {b.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="bg-surface py-20 md:py-28">
        <Container>
          <SectionHeader
            eyebrow="Values"
            title={
              <>
                What we hold to
                <br />
                <span className="text-serif italic font-normal text-muted">
                  on every project.
                </span>
              </>
            }
          />
          <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] md:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="flex flex-col gap-4 bg-background p-8 md:p-10"
              >
                <span className="text-display text-3xl font-medium text-muted/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-display text-2xl font-medium">{v.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <section className="py-20 md:py-28">
        <Container>
          <SectionHeader
            eyebrow="Timeline"
            title={
              <>
                A short history
                <br />
                <span className="text-serif italic font-normal text-muted">
                  of the studio.
                </span>
              </>
            }
          />
          <div className="mt-16 flex flex-col">
            {timeline.map((t, i) => (
              <div
                key={t.year}
                className="grid grid-cols-1 gap-6 border-t border-[color:var(--color-border)] py-10 md:grid-cols-12"
              >
                <div className="md:col-span-2">
                  <span className="text-display text-3xl font-medium text-[#ff3131]">
                    {t.year}
                  </span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-display text-2xl font-medium leading-tight md:text-3xl">
                    {t.title}
                  </h3>
                </div>
                <p className="text-lg leading-relaxed text-muted md:col-span-6">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Process condensed */}
      <section className="bg-[#282a2a] py-20 text-white md:py-28">
        <Container>
          <SectionHeader
            eyebrow="Process"
            title={
              <span className="text-white">
                How we work,
                <br />
                <span className="text-serif italic font-normal text-white/60">
                  every engagement.
                </span>
              </span>
            }
          />
          <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-5">
            {processSteps.map((s) => (
              <div
                key={s.number}
                className="flex flex-col gap-3 bg-[#282a2a] p-6 md:p-8"
              >
                <span className="text-xs uppercase tracking-[0.18em] text-white/40">
                  {s.number}
                </span>
                <h4 className="text-display text-xl font-medium">{s.title}</h4>
                <p className="text-sm leading-relaxed text-white/60">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <HomeCta />
    </>
  );
}
