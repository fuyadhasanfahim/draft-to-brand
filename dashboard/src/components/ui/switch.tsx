"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, checked, defaultChecked, onCheckedChange, ...props }, ref) => {
    const reactId = React.useId();
    const inputId = id ?? reactId;
    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-3 cursor-pointer select-none">
        <span className="relative inline-flex h-5 w-9 items-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            className={cn("peer absolute inset-0 h-full w-full opacity-0 cursor-pointer", className)}
            {...props}
          />
          <span className="h-5 w-9 rounded-full bg-[var(--color-border)] transition-colors peer-checked:bg-[var(--color-dark)]" />
          <span className="pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </span>
        {label ? <span className="text-sm text-[var(--color-foreground)]">{label}</span> : null}
      </label>
    );
  }
);
Switch.displayName = "Switch";
