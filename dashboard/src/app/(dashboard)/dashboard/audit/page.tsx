import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge, EmptyState } from "@/components/ui";
import { loadAuditPage, type AuditFilters } from "@/features/audit/query";
import { AuditFilters as AuditFiltersForm } from "@/features/audit/audit-filters";
import { ActorCell } from "@/features/audit/actor-cell";
import { MetadataCell } from "@/features/audit/metadata-cell";
import { AuditPagination } from "@/features/audit/audit-pagination";

export const metadata = { title: "Audit Log" };

const PAGE_SIZE = 25;

type SearchParams = Record<string, string | string[] | undefined>;

function singleParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseDateOrUndefined(v: string | undefined, endOfDay = false): Date | undefined {
  if (!v) return undefined;
  // Accept YYYY-MM-DD from the <input type="date"> control.
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  if (!(await can("audit.view"))) notFound();

  const sp = await searchParams;
  const filters: AuditFilters = {
    q: singleParam(sp.q),
    resource: singleParam(sp.resource),
    actionPrefix: singleParam(sp.action),
    from: parseDateOrUndefined(singleParam(sp.from)),
    to: parseDateOrUndefined(singleParam(sp.to), true),
  };
  const page = Math.max(1, parseInt(singleParam(sp.page) ?? "1", 10) || 1);

  const { rows, total } = await loadAuditPage({
    organizationId: session.member.organizationId,
    filters,
    page,
    pageSize: PAGE_SIZE,
  });

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Audit log"
        description="Every mutation in this workspace — members, roles, invitations, branches, departments, teams, and the email security system."
      />

      <AuditFiltersForm />

      {rows.length === 0 ? (
        <EmptyState
          title="No events match these filters"
          description="Adjust your search, expand the date range, or clear the filters to see every event."
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-[var(--color-background)] text-left text-[11px] uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">Actor</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">Resource</th>
                  <th className="px-4 py-2.5 font-medium hidden md:table-cell">IP</th>
                  <th className="px-4 py-2.5 font-medium hidden lg:table-cell">User Agent</th>
                  <th className="px-4 py-2.5 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-[var(--color-background)]"
                  >
                    <td className="px-4 py-3 align-top whitespace-nowrap">
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] text-[var(--color-foreground)]">
                          {format(r.createdAt, "MMM d, HH:mm:ss")}
                        </span>
                        <span className="text-[10px] text-[var(--color-muted)]">
                          {format(r.createdAt, "yyyy")}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ActorCell actor={r.actor} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <code className="text-[12px] font-mono text-[var(--color-foreground)]">
                        {r.action}
                      </code>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col leading-tight">
                        <Badge variant="neutral" className="w-fit">{r.resource}</Badge>
                        {r.resourceId ? (
                          <code className="mt-1 text-[10px] text-[var(--color-muted)] font-mono truncate max-w-[180px]">
                            {r.resourceId}
                          </code>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top hidden md:table-cell">
                      <code className="text-[11px] text-[var(--color-muted-foreground)] font-mono">
                        {r.ipAddress ?? "—"}
                      </code>
                    </td>
                    <td className="px-4 py-3 align-top hidden lg:table-cell max-w-[280px]">
                      <span className="text-[11px] text-[var(--color-muted-foreground)] truncate block">
                        {r.userAgent ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <MetadataCell value={r.metadata} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AuditPagination page={page} pageCount={pageCount} total={total} />
    </div>
  );
}

export const dynamic = "force-dynamic";
