import Link from "next/link";
import { pricing } from "@/lib/data";
import { IconCheck, IconArrowUpRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function PricingCards() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {pricing.map((p) => (
        <div
          key={p.name}
          className={cn(
            "relative flex flex-col rounded-3xl p-8 md:p-10",
            p.recommended
              ? "bg-[#282a2a] text-white shadow-[0_30px_80px_-20px_rgba(40,42,42,0.4)]"
              : "glass-card text-foreground",
          )}
        >
          {p.recommended && (
            <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#ff3131] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
              <span className="grid h-1.5 w-1.5 rounded-full bg-white" />
              Recommended
            </span>
          )}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs uppercase tracking-[0.18em]",
                p.recommended ? "text-white/60" : "text-muted",
              )}
            >
              {p.name}
            </span>
          </div>
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-display text-5xl font-medium md:text-6xl">
              {p.price}
            </span>
            <span
              className={cn(
                "text-sm",
                p.recommended ? "text-white/60" : "text-muted",
              )}
            >
              {p.cadence}
            </span>
          </div>
          <p
            className={cn(
              "mt-5 text-[15px] leading-relaxed",
              p.recommended ? "text-white/80" : "text-muted",
            )}
          >
            {p.description}
          </p>

          <ul className="mt-8 flex flex-col gap-3 border-t border-current/10 pt-8">
            {p.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-3 text-[15px]"
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                    p.recommended
                      ? "bg-[#ff3131] text-white"
                      : "bg-[#ff3131]/10 text-[#ff3131]",
                  )}
                >
                  <IconCheck size={12} stroke={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/contact"
            className={cn(
              "mt-10 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-medium transition-all",
              p.recommended
                ? "bg-[#ff3131] text-white hover:-translate-y-0.5"
                : "bg-[#282a2a] text-white hover:-translate-y-0.5",
            )}
          >
            {p.cta}
            <IconArrowUpRight size={16} />
          </Link>
        </div>
      ))}
    </div>
  );
}
