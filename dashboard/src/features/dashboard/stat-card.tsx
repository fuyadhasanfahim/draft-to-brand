/**
 * Numeric KPI tile. Server-component-friendly: no client hooks, no state.
 * Renders a label, a big number, and an optional secondary hint line.
 */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-[var(--color-foreground)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
