import { startOfDay, startOfMonth } from "date-fns";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui";
import { StatCard } from "@/features/dashboard/stat-card";
import {
  PipelineOverview,
  type PipelineOverviewData,
} from "@/features/dashboard/pipeline-overview";
import {
  LeadSourceTable,
  type LeadSourceRow,
} from "@/features/dashboard/lead-source-table";
import {
  OwnerLeaderboard,
  type OwnerRow,
} from "@/features/dashboard/owner-leaderboard";
import {
  RecentActivity,
  type ActivityRow,
} from "@/features/dashboard/recent-activity";
import { formatMoney, formatPercent, toNumber } from "@/features/dashboard/format";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const session = await getServerSession();
  if (!session) return null;
  const orgId = session.member.organizationId;
  const canViewLeads = await can("leads.view");

  if (!canViewLeads) {
    // CRM widgets need leads.view. Fall back to the original lightweight
    // welcome screen for members without lead access (e.g. HR-only).
    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-display text-3xl">
            Welcome back, {session.user.name.split(" ")[0]}.
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)] max-w-2xl">
            You&rsquo;re signed in to{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {session.member.organization.name}
            </span>{" "}
            as{" "}
            <span className="font-medium text-[var(--color-foreground)]">
              {session.member.role.name}
            </span>
            .
          </p>
        </header>
      </div>
    );
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  // ─── Aggregate queries — all server-side, all sargable ───────────────
  // We never load Lead rows into memory for KPI math; everything goes
  // through count / aggregate / groupBy.

  const activeWhere = { organizationId: orgId, archivedAt: null } as const;

  const [
    totalCount,
    activeCount,
    wonCount,
    lostCount,
    todayCount,
    monthCount,
    valueAgg,
    pipelineValueAgg,
    stageAgg,
    sourceAgg,
    ownerAllAgg,
    ownerWonAgg,
    pipelines,
    leadSources,
    members,
    activities,
  ] = await Promise.all([
    prisma.lead.count({ where: activeWhere }),
    prisma.lead.count({ where: { ...activeWhere, status: "OPEN" } }),
    prisma.lead.count({ where: { ...activeWhere, status: "WON" } }),
    prisma.lead.count({ where: { ...activeWhere, status: "LOST" } }),
    prisma.lead.count({ where: { ...activeWhere, createdAt: { gte: todayStart } } }),
    prisma.lead.count({ where: { ...activeWhere, createdAt: { gte: monthStart } } }),
    prisma.lead.aggregate({
      where: activeWhere,
      _sum: { estimatedValue: true },
      _avg: { estimatedValue: true },
    }),
    prisma.lead.aggregate({
      where: { ...activeWhere, status: "OPEN" },
      _sum: { estimatedValue: true },
    }),
    prisma.lead.groupBy({
      by: ["stageId"],
      where: activeWhere,
      _count: { _all: true },
      _sum: { estimatedValue: true },
    }),
    prisma.lead.groupBy({
      by: ["leadSourceId"],
      where: activeWhere,
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["ownerId"],
      where: activeWhere,
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["ownerId"],
      where: { ...activeWhere, status: "WON" },
      _count: { _all: true },
    }),
    prisma.pipeline.findMany({
      where: { organizationId: orgId, archivedAt: null },
      include: {
        stages: {
          select: { id: true, name: true, color: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.leadSource.findMany({
      where: { organizationId: orgId, isActive: true, archivedAt: null },
      select: { id: true, name: true, color: true },
    }),
    prisma.member.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      include: { user: { select: { name: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.leadActivity.findMany({
      where: { organizationId: orgId },
      include: {
        lead: { select: { id: true, title: true } },
        createdBy: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  // ─── KPI derivations ──────────────────────────────────────────────────

  const totalPipelineValue = toNumber(pipelineValueAgg._sum.estimatedValue);
  const avgLeadValue = toNumber(valueAgg._avg.estimatedValue);
  const conversionRate = formatPercent(wonCount, wonCount + lostCount);

  // ─── Pipeline overview ────────────────────────────────────────────────
  // Map the grouped aggregates onto each pipeline's stage list. Missing
  // stages (no leads yet) render as zeroed cards rather than disappearing.

  const stageStatsById = new Map(
    stageAgg.map((row) => [
      row.stageId,
      {
        count: row._count._all,
        value: toNumber(row._sum.estimatedValue),
      },
    ])
  );

  const pipelineRows: PipelineOverviewData[] = pipelines.map((p) => ({
    id: p.id,
    name: p.name,
    isDefault: p.isDefault,
    stages: p.stages.map((s) => {
      const stat = stageStatsById.get(s.id);
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        sortOrder: s.sortOrder,
        leadCount: stat?.count ?? 0,
        totalValue: stat?.value ?? 0,
      };
    }),
  }));

  // ─── Lead source analytics ────────────────────────────────────────────

  const sourceById = new Map(leadSources.map((s) => [s.id, s]));
  const sourceRows: LeadSourceRow[] = sourceAgg
    .map((row) => {
      if (row.leadSourceId === null) {
        return {
          id: null,
          name: "No source",
          color: null,
          count: row._count._all,
        } as LeadSourceRow;
      }
      const src = sourceById.get(row.leadSourceId);
      if (!src) return null; // archived/deleted source — drop
      return {
        id: src.id,
        name: src.name,
        color: src.color,
        count: row._count._all,
      } as LeadSourceRow;
    })
    .filter((r): r is LeadSourceRow => r !== null)
    .sort((a, b) => b.count - a.count);

  // ─── Owner leaderboard ────────────────────────────────────────────────

  const wonByOwner = new Map(
    ownerWonAgg.map((row) => [row.ownerId, row._count._all])
  );
  const memberById = new Map(members.map((m) => [m.id, m]));

  const ownerRows: OwnerRow[] = ownerAllAgg
    .map((row) => {
      const won = wonByOwner.get(row.ownerId) ?? 0;
      if (row.ownerId === null) {
        return {
          memberId: null,
          name: "Unassigned",
          image: null,
          assigned: row._count._all,
          won,
        } as OwnerRow;
      }
      const m = memberById.get(row.ownerId);
      if (!m) return null;
      return {
        memberId: m.id,
        name: m.user.name,
        image: m.user.image,
        assigned: row._count._all,
        won,
      } as OwnerRow;
    })
    .filter((r): r is OwnerRow => r !== null)
    .sort((a, b) => b.won - a.won || b.assigned - a.assigned);

  // ─── Activity feed ────────────────────────────────────────────────────

  const activityRows: ActivityRow[] = activities.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    createdAt: a.createdAt,
    lead: a.lead,
    createdBy: a.createdBy,
  }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">
          Welcome back, {session.user.name.split(" ")[0]}.
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] max-w-2xl">
          Snapshot of pipeline health across{" "}
          <span className="font-medium text-[var(--color-foreground)]">
            {session.member.organization.name}
          </span>
          . Numbers exclude archived leads.
        </p>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Total leads" value={totalCount} />
        <StatCard label="Active" value={activeCount} hint="Status: Open" />
        <StatCard label="Won" value={wonCount} />
        <StatCard label="Lost" value={lostCount} />
        <StatCard
          label="Conversion"
          value={conversionRate}
          hint="Won ÷ (Won + Lost)"
        />
        <StatCard label="Created today" value={todayCount} />
        <StatCard label="Created this month" value={monthCount} />
        <StatCard
          label="Open pipeline value"
          value={formatMoney(totalPipelineValue)}
          hint="Sum across all open leads"
        />
        <StatCard
          label="Avg lead value"
          value={formatMoney(avgLeadValue)}
          hint="Across active leads"
        />
      </section>

      {/* Pipeline overview */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-semibold text-[var(--color-foreground)]">
            Pipeline overview
          </h2>
          <span className="text-[11px] text-[var(--color-muted)]">
            Active leads only
          </span>
        </div>
        <PipelineOverview pipelines={pipelineRows} />
      </section>

      {/* Two-column block: Lead sources + Owner leaderboard */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-[14px] font-semibold text-[var(--color-foreground)]">
            Lead sources
          </h2>
          <LeadSourceTable rows={sourceRows} />
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-[14px] font-semibold text-[var(--color-foreground)]">
            Owner performance
          </h2>
          <OwnerLeaderboard rows={ownerRows} />
        </div>
      </section>

      {/* Recent activity */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-semibold text-[var(--color-foreground)]">
            Recent activity
          </h2>
          <span className="text-[11px] text-[var(--color-muted)]">
            Latest {activityRows.length}
          </span>
        </div>
        <RecentActivity rows={activityRows} />
      </section>
    </div>
  );
}
