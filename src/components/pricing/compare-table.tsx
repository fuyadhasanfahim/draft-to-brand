import { compareRows, pricing } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CompareTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-surface">
      <div className="grid grid-cols-4 border-b border-[color:var(--color-border)] bg-white">
        <div className="p-6 text-xs uppercase tracking-[0.18em] text-muted">
          Compare plans
        </div>
        {pricing.map((p) => (
          <div
            key={p.name}
            className={cn(
              "p-6 text-center",
              p.recommended && "bg-[#282a2a] text-white",
            )}
          >
            <div
              className={cn(
                "text-xs uppercase tracking-[0.18em]",
                p.recommended ? "text-white/60" : "text-muted",
              )}
            >
              {p.name}
            </div>
            <div className="text-display mt-1 text-2xl font-medium">
              {p.price}
            </div>
          </div>
        ))}
      </div>
      <div className="divide-y divide-[color:var(--color-border)]">
        {compareRows.map((row) => (
          <div key={row.label} className="grid grid-cols-4 bg-white">
            <div className="p-5 text-sm font-medium">{row.label}</div>
            {row.values.map((v, i) => (
              <div
                key={i}
                className={cn(
                  "p-5 text-center text-sm",
                  i === 1 && "bg-[#fafaf9] font-medium",
                )}
              >
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
