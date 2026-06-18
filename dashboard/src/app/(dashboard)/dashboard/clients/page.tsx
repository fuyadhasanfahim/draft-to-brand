import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import {
  ClientsPageClient,
  type ClientRow,
} from "@/features/clients/clients-page-client";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await requireSession();
  if (!(await can("clients.view"))) notFound();
  const orgId = session.member.organizationId;

  const [clients, companies, owners, canCreate, canEdit, canDelete, canManage] =
    await Promise.all([
      prisma.client.findMany({
        where: { organizationId: orgId },
        include: {
          company: { select: { id: true, name: true } },
          owner: { include: { user: { select: { name: true } } } },
        },
        orderBy: [{ archivedAt: "asc" }, { createdAt: "desc" }],
      }),
      prisma.company.findMany({
        where: { organizationId: orgId, archivedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.member.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: { user: { select: { name: true } } },
        orderBy: { joinedAt: "asc" },
      }),
      can("clients.create"),
      can("clients.edit"),
      can("clients.delete"),
      can("clients.manage"),
    ]);

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    companyId: c.companyId,
    ownerId: c.ownerId,
    status: c.status,
    onboardingStatus: c.onboardingStatus,
    startDate: c.startDate,
    notes: c.notes,
    archivedAt: c.archivedAt,
    createdAt: c.createdAt,
    company: c.company,
    owner: c.owner
      ? { id: c.owner.id, user: { name: c.owner.user.name } }
      : null,
  }));

  const choices = {
    companies,
    owners: owners.map((m) => ({ id: m.id, name: m.user.name })),
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Post-sale customers. Convert a won Lead or create a Client manually."
      />
      <ClientsPageClient
        clients={rows}
        choices={choices}
        canCreate={canCreate || canManage}
        canEdit={canEdit || canManage}
        canDelete={canDelete || canManage}
      />
    </div>
  );
}
