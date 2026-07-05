import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
  variant = "card",
}: {
  children: ReactNode;
  className?: string;
  variant?: "card" | "floating" | "dark";
}) {
  const map = {
    card: "glass-card",
    floating: "glass-floating",
    dark: "glass-dark",
  } as const;
  return (
    <div className={cn(map[variant], "rounded-3xl", className)}>{children}</div>
  );
}
