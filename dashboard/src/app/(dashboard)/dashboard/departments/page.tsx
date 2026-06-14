import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { DepartmentsPageClient } from "@/features/departments/departments-page-client";

export const metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  const session = await requireSession();
  if (!(await can("departments.view"))) notFound();

  const orgId = session.member.organizationId;
  const [departments, branches, canManage] = await Promise.all([
    prisma.department.findMany({
      where: { organizationId: orgId },
      include: { branch: { select: { id: true, name: true } } },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    prisma.branch.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    can("departments.manage"),
  ]);

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Functional groups that organize teams and members."
      />
      <DepartmentsPageClient departments={departments} branches={branches} canManage={canManage} />
    </div>
  );
}
