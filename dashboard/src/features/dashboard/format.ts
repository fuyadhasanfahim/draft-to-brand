/**
 * Dashboard-scoped formatting helpers. KPI values can mix currencies across
 * leads, so we render aggregates in a single display currency (defaults to
 * USD) and call that out in the validation report. Per-lead currency stays
 * authoritative on the Lead record itself.
 */

const DISPLAY_CURRENCY = "USD";

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: DISPLAY_CURRENCY,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${DISPLAY_CURRENCY}`;
  }
}

export function formatPercent(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  const pct = (numerator / denominator) * 100;
  return `${pct.toFixed(1)}%`;
}

export function toNumber(decimalLike: { toString: () => string } | null | undefined): number {
  if (decimalLike === null || decimalLike === undefined) return 0;
  const n = Number(decimalLike.toString());
  return Number.isNaN(n) ? 0 : n;
}
