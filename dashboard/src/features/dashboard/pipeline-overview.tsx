import { EmptyState } from "@/components/ui";
import { formatMoney } from "./format";

export type PipelineOverviewData = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: {
    id: string;
    name: string;
    color: string;
    sortOrder: number;
    leadCount: number;
    totalValue: number;
  }[];
};

export function PipelineOverview({ pipelines }: { pipelines: PipelineOverviewData[] }) {
  if (pipelines.length === 0) {
    return (
      <EmptyState
        title="No pipelines yet"
        description="Configure pipelines in Settings to see stage-level breakdowns here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pipelines.map((p) => {
        const total = p.stages.reduce((sum, s) => sum + s.leadCount, 0);
        return (
          <section
            key={p.id}
            className="surface-card p-4"
          >
            <header className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-[14px] font-semibold text-[var(--color-foreground)] truncate">
                  {p.name}
                </h3>
                {p.isDefault ? (
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    Default
                  </span>
                ) : null}
              </div>
              <span className="text-[12px] text-[var(--color-muted-foreground)] tabular-nums">
                {total} lead{total === 1 ? "" : "s"}
              </span>
            </header>

            {p.stages.length === 0 ? (
              <p className="text-[12px] text-[var(--color-muted)]">No stages.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                {p.stages.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-[12px] font-medium text-[var(--color-foreground)] truncate">
                        {s.name}
                      </span>
                    </div>
                    <p className="mt-1 text-[15px] font-semibold tabular-nums text-[var(--color-foreground)]">
                      {s.leadCount}
                    </p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)] tabular-nums">
                      {formatMoney(s.totalValue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
