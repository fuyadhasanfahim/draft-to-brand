import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import {
  LeadsPageClient,
  type LeadRow,
} from "@/features/leads/leads-page-client";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const session = await requireSession();
  if (!(await can("leads.view"))) notFound();
  const orgId = session.member.organizationId;

  const [
    leads,
    pipelines,
    companies,
    contacts,
    leadSources,
    owners,
    canCreate,
    canEdit,
    canDelete,
    canManage,
  ] = await Promise.all([
    prisma.lead.findMany({
      where: { organizationId: orgId },
      include: {
        company:    { select: { id: true, name: true } },
        contact:    { select: { id: true, firstName: true, lastName: true } },
        leadSource: { select: { id: true, name: true, color: true } },
        owner:      { include: { user: { select: { name: true } } } },
        pipeline:   { select: { id: true, name: true } },
        stage:      { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.pipeline.findMany({
      where: { organizationId: orgId, archivedAt: null },
      include: {
        stages: {
          select: { id: true, name: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.company.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { id: true, firstName: true, lastName: true, companyId: true },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.leadSource.findMany({
      where: { organizationId: orgId, isActive: true, archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.member.findMany({
      where: { organizationId: orgId, status: "ACTIVE" },
      include: { user: { select: { name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    can("leads.create"),
    can("leads.edit"),
    can("leads.delete"),
    can("leads.manage"),
  ]);

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    title: l.title,
    status: l.status,
    priority: l.priority,
    estimatedValue: l.estimatedValue ? l.estimatedValue.toString() : null,
    currency: l.currency,
    expectedCloseDate: l.expectedCloseDate,
    archivedAt: l.archivedAt,
    createdAt: l.createdAt,
    companyId: l.companyId,
    contactId: l.contactId,
    leadSourceId: l.leadSourceId,
    ownerId: l.ownerId,
    pipelineId: l.pipelineId,
    stageId: l.stageId,
    description: l.description,
    company: l.company,
    contact: l.contact,
    leadSource: l.leadSource,
    owner: l.owner ? { id: l.owner.id, user: { name: l.owner.user.name } } : null,
    pipeline: l.pipeline,
    stage: l.stage,
  }));

  const choices = {
    pipelines: pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      stages: p.stages,
    })),
    companies,
    contacts: contacts.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      companyId: c.companyId,
    })),
    leadSources,
    owners: owners.map((m) => ({ id: m.id, name: m.user.name })),
  };

  const defaultPipelineId =
    pipelines.find((p) => p.isDefault)?.id ?? pipelines[0]?.id;

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Active sales opportunities walking the stages of your pipelines."
      />
      <LeadsPageClient
        leads={rows}
        choices={choices}
        canCreate={canCreate || canManage}
        canEdit={canEdit || canManage}
        canDelete={canDelete || canManage}
        defaultPipelineId={defaultPipelineId}
      />
    </div>
  );
}
