"use client";
import * as React from "react";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const internalId = React.useId();
    const inputId = id ?? internalId;
    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer select-none">
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className={cn("peer absolute inset-0 h-full w-full opacity-0 cursor-pointer", className)}
            {...props}
          />
          <span
            className={cn(
              "h-4 w-4 rounded-[5px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] transition-colors",
              "peer-checked:bg-[var(--color-dark)] peer-checked:border-[var(--color-dark)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-dark)]/20"
            )}
          />
          <IconCheck
            size={11}
            stroke={3}
            className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity"
          />
        </span>
        {label ? <span className="text-sm text-[var(--color-foreground)]">{label}</span> : null}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
