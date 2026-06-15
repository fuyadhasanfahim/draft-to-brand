import * as React from "react";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-[var(--color-foreground)]", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

/**
 * Small red asterisk after a field label. Brand-token red, accessible
 * `aria-hidden` (the surrounding `<Field required>` also flags the
 * underlying control via `aria-required`). Pulled into its own component
 * so there's exactly one place that styles required-field markers.
 */
export function RequiredMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-0.5 text-[var(--color-primary)] select-none font-medium",
        className
      )}
      title="Required"
    >
      *
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  required = false,
  children,
  className,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Renders a red asterisk after the label and sets aria-required on the input. */
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  // If `required` is set and `children` is a single ReactElement (typical
  // <Input/> / <Select/> / <Textarea/>), thread `aria-required` through so
  // assistive tech announces the requirement even before validation fires.
  const decoratedChildren = (() => {
    if (!required) return children;
    if (!React.isValidElement(children)) return children;
    const existing = children.props as Record<string, unknown> | undefined;
    if (existing && "aria-required" in existing) return children;
    return React.cloneElement(children, { "aria-required": true } as Record<string, unknown>);
  })();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <Label>
          {label}
          {required ? <RequiredMark /> : null}
        </Label>
      ) : null}
      {decoratedChildren}
      {error ? (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
