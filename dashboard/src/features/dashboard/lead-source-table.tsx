import { EmptyState } from "@/components/ui";

export type LeadSourceRow = {
  id: string | null;
  name: string;
  color: string | null;
  count: number;
};

export function LeadSourceTable({ rows }: { rows: LeadSourceRow[] }) {
  if (rows.length === 0 || rows.every((r) => r.count === 0)) {
    return (
      <EmptyState
        title="No lead source data"
        description="Lead sources will appear here once leads are tagged with where they came from."
      />
    );
  }

  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-[13px]">
        <thead className="bg-[var(--color-background)] text-left text-[11px] uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-border)]">
          <tr>
            <th className="px-4 py-2.5 font-medium">Source</th>
            <th className="px-4 py-2.5 font-medium text-right">Leads</th>
            <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((r) => {
            const pct = (r.count / max) * 100;
            return (
              <tr key={r.id ?? "__none__"} className="hover:bg-[var(--color-background)] transition-colors">
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2">
                    {r.color ? (
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: r.color }}
                      />
                    ) : null}
                    <span className="text-[var(--color-foreground)]">{r.name}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-[var(--color-foreground)] tabular-nums">
                  {r.count}
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell">
                  <div className="h-1.5 w-full max-w-[160px] rounded-full bg-[var(--color-background)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
