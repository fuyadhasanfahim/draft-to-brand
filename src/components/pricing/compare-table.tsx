import { compareRows, pricing } from "@/lib/data";
import { cn } from "@/lib/utils";

export function CompareTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-surface">
      {/* Horizontal scroll wrapper for narrow screens */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-4 border-b border-[color:var(--color-border)] bg-white">
            <div className="p-4 text-xs uppercase tracking-[0.18em] text-muted md:p-6">
              Compare plans
            </div>
            {pricing.map((p) => (
              <div
                key={p.name}
                className={cn(
                  "p-4 text-center md:p-6",
                  p.recommended && "bg-[#282a2a] text-white",
                )}
              >
                <div
                  className={cn(
                    "text-[10px] uppercase tracking-[0.18em] md:text-xs",
                    p.recommended ? "text-white/60" : "text-muted",
                  )}
                >
                  {p.name}
                </div>
                <div className="text-display mt-1 text-lg font-medium md:text-2xl">
                  {p.price}
                </div>
              </div>
            ))}
          </div>
          <div className="divide-y divide-[color:var(--color-border)]">
            {compareRows.map((row) => (
              <div key={row.label} className="grid grid-cols-4 bg-white">
                <div className="p-4 text-xs font-medium md:p-5 md:text-sm">
                  {row.label}
                </div>
                {row.values.map((v, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-4 text-center text-xs md:p-5 md:text-sm",
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
      </div>
    </div>
  );
}
