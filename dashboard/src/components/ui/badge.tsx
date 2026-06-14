import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide leading-none border",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--color-surface)] text-[var(--color-muted-foreground)] border-[var(--color-border)]",
        primary: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20",
        success: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20",
        warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-[var(--color-warning)]/20",
        danger:  "bg-[var(--color-danger)]/10  text-[var(--color-danger)]  border-[var(--color-danger)]/20",
        info:    "bg-[var(--color-info)]/10    text-[var(--color-info)]    border-[var(--color-info)]/20",
        dark:    "bg-[var(--color-dark)]       text-white                  border-transparent",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
