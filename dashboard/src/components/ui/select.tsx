import * as React from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        data-invalid={invalid || undefined}
        className={cn(
          "appearance-none flex h-10 w-full rounded-[var(--radius-md)] bg-[var(--color-surface)] pl-3 pr-9 text-sm text-[var(--color-foreground)]",
          "border border-[var(--color-border)] shadow-[var(--shadow-xs)] cursor-pointer",
          "focus:outline-none focus:border-[var(--color-dark)] focus:ring-2 focus:ring-[var(--color-dark)]/10",
          "data-[invalid]:border-[var(--color-danger)]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <IconChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
      />
    </div>
  )
);
Select.displayName = "Select";
