"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const reactId = React.useId();
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  return (
    <RadioGroupContext.Provider
      value={{
        name: name ?? reactId,
        value: current,
        onValueChange: (v) => {
          if (!isControlled) setInternal(v);
          onValueChange?.(v);
        },
      }}
    >
      <div role="radiogroup" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "value" | "onChange"> {
  value: string;
  label?: React.ReactNode;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ value, label, id, className, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext);
    if (!ctx) throw new Error("Radio must be used inside <RadioGroup>");
    const reactId = React.useId();
    const inputId = id ?? reactId;
    const checked = ctx.value === value;

    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer select-none">
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="radio"
            name={ctx.name}
            value={value}
            checked={checked}
            onChange={() => ctx.onValueChange?.(value)}
            className={cn("peer absolute inset-0 opacity-0 cursor-pointer", className)}
            {...props}
          />
          <span className="h-4 w-4 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] peer-checked:border-[var(--color-dark)] transition-colors" />
          <span className="pointer-events-none absolute h-2 w-2 rounded-full bg-[var(--color-dark)] opacity-0 peer-checked:opacity-100" />
        </span>
        {label ? <span className="text-sm text-[var(--color-foreground)]">{label}</span> : null}
      </label>
    );
  }
);
Radio.displayName = "Radio";
