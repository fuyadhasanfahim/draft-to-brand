import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { BranchesPageClient } from "@/features/branches/branches-page-client";

export const metadata = { title: "Branches" };

export default async function BranchesPage() {
  const session = await requireSession();
  if (!(await can("branches.view"))) notFound();

  const [branches, canManage] = await Promise.all([
    prisma.branch.findMany({
      where: { organizationId: session.member.organizationId },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    can("branches.manage"),
  ]);

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Physical or organizational locations of your agency."
      />
      <BranchesPageClient branches={branches} canManage={canManage} />
    </div>
  );
}
