import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { MembersTable } from "@/features/members/members-table";
import { InvitationsTable } from "@/features/members/invitations-table";
import { InviteMemberDialog } from "@/features/members/invite-member-dialog";

export const metadata = { title: "Members" };

export default async function MembersPage() {
  const session = await requireSession();
  if (!(await can("members.view"))) notFound();

  const orgId = session.member.organizationId;
  const [members, invitations, roles, branches, departments, teams, canEdit, canRemove, canInvite] =
    await Promise.all([
      prisma.member.findMany({
        where: { organizationId: orgId, status: { not: "ARCHIVED" } },
        include: {
          user: { select: { id: true, name: true, email: true, image: true, emailVerified: true } },
          role: { select: { id: true, name: true, slug: true } },
          branch: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: { joinedAt: "desc" },
      }),
      prisma.invitation.findMany({
        // Soft-deleted invitations stay in the DB for audit/compliance
        // but are hidden from the operator UI.
        where: { organizationId: orgId, status: { not: "DELETED" } },
        include: { role: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.role.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, slug: true, isSystem: true },
        orderBy: [{ priority: "desc" }, { name: "asc" }],
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
      prisma.team.findMany({
        where: { organizationId: orgId, archivedAt: null },
        select: { id: true, name: true, branchId: true, departmentId: true },
        orderBy: { name: "asc" },
      }),
      can("members.edit"),
      can("members.remove"),
      can("members.invite"),
    ]);

  return (
    <div>
      <PageHeader
        title="Members"
        description="Manage who can access this workspace, their role, and where they sit."
        actions={
          canInvite ? (
            <InviteMemberDialog
              roles={roles}
              branches={branches}
              departments={departments}
              teams={teams}
            />
          ) : null
        }
      />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitations.filter((i) => i.status === "PENDING").length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <MembersTable
            members={members}
            roles={roles}
            branches={branches}
            departments={departments}
            teams={teams}
            canEdit={canEdit}
            canRemove={canRemove}
          />
        </TabsContent>
        <TabsContent value="invitations">
          <InvitationsTable
            invitations={invitations}
            canManage={canInvite}
            roles={roles}
            branches={branches}
            departments={departments}
            teams={teams}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
