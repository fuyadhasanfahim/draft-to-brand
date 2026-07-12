import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Badge({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "dark";
}) {
  const tones = {
    default:
      "border-[color:var(--color-border)] bg-white/70 text-foreground",
    accent: "border-[#ff3131]/20 bg-[#ff3131]/8 text-[color:var(--color-primary-text)]",
    dark: "border-white/10 bg-[#282a2a] text-white",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium tracking-tight backdrop-blur",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
