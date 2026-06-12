import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Reveal } from "./animations/reveal";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <span className="section-eyebrow">{eyebrow}</span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="text-display text-3xl font-medium text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p
            className={cn(
              "max-w-2xl text-lg leading-relaxed text-muted md:text-xl",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
      {children}
    </div>
  );
}
