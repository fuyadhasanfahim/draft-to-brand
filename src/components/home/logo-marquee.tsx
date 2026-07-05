import { Container } from "../shared/container";

const logos = [
  "TSC",
  "The Ultimate Tooth Station",
  "Cut Out Pixel",
  "Family Rialto",
  "An Nisa's World",
  "Cholo Academy",
  "Bindu IT",
  "Bindu Mart",
  "Fuyad Hasan Fahim",
];

export function LogoMarquee() {
  return (
    <section className="border-y border-[color:var(--color-border)] bg-surface py-10">
      <Container>
        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-12">
          <p className="shrink-0 text-center text-[11px] uppercase tracking-[0.2em] text-muted md:max-w-[200px] md:text-left md:text-xs">
            Trusted by ambitious teams in 14 countries.
          </p>
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max animate-marquee gap-10 md:gap-14">
              {[...logos, ...logos].map((name, i) => (
                <span
                  key={i}
                  className="text-display whitespace-nowrap text-xl font-medium tracking-tight text-foreground/40 md:text-3xl"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
