import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      data-invalid={invalid || undefined}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]",
        "border border-[var(--color-border)] shadow-[var(--shadow-xs)]",
        "transition-colors duration-150",
        "focus:outline-none focus:border-[var(--color-dark)] focus:ring-2 focus:ring-[var(--color-dark)]/10",
        "data-[invalid]:border-[var(--color-danger)] data-[invalid]:focus:ring-[var(--color-danger)]/15",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
