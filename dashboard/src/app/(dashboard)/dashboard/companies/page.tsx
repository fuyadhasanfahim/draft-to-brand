import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { CompaniesPageClient } from "@/features/crm/companies-page-client";

export const metadata = { title: "Companies" };

export default async function CompaniesPage() {
  const session = await requireSession();
  if (!(await can("companies.view"))) notFound();

  const orgId = session.member.organizationId;
  const [companies, tags, canManage, canManageTags] = await Promise.all([
    prisma.company.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { contacts: true } },
        tags: { include: { tag: true } },
      },
      orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
    }),
    prisma.tag.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    can("companies.manage"),
    can("tags.manage"),
  ]);

  const tagsById = Object.fromEntries(tags.map((t) => [t.id, t]));

  return (
    <div>
      <PageHeader
        title="Companies"
        description="The CRM's root record — every contact, note, and (later) deal hangs off a company."
      />
      <CompaniesPageClient
        companies={companies}
        tags={tags}
        tagsById={tagsById}
        canManage={canManage}
        canManageTags={canManageTags}
      />
    </div>
  );
}
