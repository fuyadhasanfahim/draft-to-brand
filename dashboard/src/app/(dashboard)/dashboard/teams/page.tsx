import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { TeamsPageClient } from "@/features/teams/teams-page-client";

export const metadata = { title: "Teams" };

export default async function TeamsPage() {
  const session = await requireSession();
  if (!(await can("teams.view"))) notFound();

  const orgId = session.member.organizationId;
  const [teams, branches, departments, leadMembers, canManage] = await Promise.all([
    prisma.team.findMany({
      where: { organizationId: orgId },
      include: {
        branch: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    prisma.branch.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true, branchId: true },
      orderBy: { name: "asc" },
    }),
    prisma.member.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      include: { user: { select: { name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    can("teams.manage"),
  ]);

  const leads = leadMembers.map((m) => ({ id: m.id, name: m.user.name }));

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Operational units that own work inside departments."
      />
      <TeamsPageClient
        teams={teams}
        branches={branches}
        departments={departments}
        leads={leads}
        canManage={canManage}
      />
    </div>
  );
}
