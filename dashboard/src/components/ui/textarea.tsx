import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      data-invalid={invalid || undefined}
      className={cn(
        "flex min-h-24 w-full rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]",
        "border border-[var(--color-border)] shadow-[var(--shadow-xs)] resize-y",
        "focus:outline-none focus:border-[var(--color-dark)] focus:ring-2 focus:ring-[var(--color-dark)]/10",
        "data-[invalid]:border-[var(--color-danger)] data-[invalid]:focus:ring-[var(--color-danger)]/15",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
