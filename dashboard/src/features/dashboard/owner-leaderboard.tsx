import { Avatar, EmptyState } from "@/components/ui";

export type OwnerRow = {
  memberId: string | null;
  name: string;
  image: string | null;
  assigned: number;
  won: number;
};

export function OwnerLeaderboard({ rows }: { rows: OwnerRow[] }) {
  if (rows.length === 0 || rows.every((r) => r.assigned === 0)) {
    return (
      <EmptyState
        title="No owner data yet"
        description="Assign owners to leads to see this leaderboard populate."
      />
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-[13px]">
        <thead className="bg-[var(--color-background)] text-left text-[11px] uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-border)]">
          <tr>
            <th className="px-4 py-2.5 font-medium">Member</th>
            <th className="px-4 py-2.5 font-medium text-right">Assigned</th>
            <th className="px-4 py-2.5 font-medium text-right">Won</th>
            <th className="px-4 py-2.5 font-medium text-right hidden sm:table-cell">
              Win rate
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {rows.map((r) => {
            const winRate = r.assigned === 0 ? "—" : `${((r.won / r.assigned) * 100).toFixed(0)}%`;
            return (
              <tr
                key={r.memberId ?? "__unassigned__"}
                className="hover:bg-[var(--color-background)] transition-colors"
              >
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <Avatar src={r.image ?? undefined} name={r.name} size="sm" />
                    <span className="text-[var(--color-foreground)] truncate">{r.name}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-[var(--color-foreground)] tabular-nums">
                  {r.assigned}
                </td>
                <td className="px-4 py-2.5 text-right text-[var(--color-foreground)] tabular-nums">
                  {r.won}
                </td>
                <td className="px-4 py-2.5 text-right text-[var(--color-muted-foreground)] tabular-nums hidden sm:table-cell">
                  {winRate}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
