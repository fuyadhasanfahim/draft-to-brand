import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { RolesTable, type RoleRow } from "@/features/roles/roles-table";

export const metadata = { title: "Roles" };

export default async function RolesPage() {
  const session = await requireSession();
  if (!(await can("roles.view"))) notFound();

  const orgId = session.member.organizationId;
  const [rawRoles, canManage] = await Promise.all([
    prisma.role.findMany({
      where: { organizationId: orgId },
      include: {
        rolePermissions: { include: { permission: { select: { key: true } } } },
        _count: { select: { members: true } },
      },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
    }),
    can("roles.manage"),
  ]);

  const roles: RoleRow[] = rawRoles.map((r) => ({
    ...r,
    permissionKeys: r.rolePermissions.map((rp) => rp.permission.key),
    memberCount: r._count.members,
  }));

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Database-driven roles for this workspace. Owner has every permission and cannot be edited."
      />
      <RolesTable roles={roles} canManage={canManage} />
    </div>
  );
}
