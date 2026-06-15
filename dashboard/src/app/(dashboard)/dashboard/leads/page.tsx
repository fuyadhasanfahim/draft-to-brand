import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import {
  LeadsPageClient,
  type LeadRow,
} from "@/features/leads/leads-page-client";

export const metadata = { title: "Leads" };

type SearchParams = Record<string, string | string[] | undefined>;

// Default Lead views show ACTIVE only. `?archived=archived` shows just
// archived; `?archived=all` shows both. Anything else falls back to active.
type ArchivedFilter = "active" | "archived" | "all";

function parseArchivedFilter(v: string | string[] | undefined): ArchivedFilter {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === "archived" || s === "all") return s;
  return "active";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  if (!(await can("leads.view"))) notFound();
  const orgId = session.member.organizationId;

  const sp = await searchParams;
  const archivedFilter = parseArchivedFilter(sp.archived);

  const leadWhere: Prisma.LeadWhereInput = { organizationId: orgId };
  if (archivedFilter === "active") leadWhere.archivedAt = null;
  else if (archivedFilter === "archived") leadWhere.archivedAt = { not: null };

  const [
    leads,
    activePipelines,
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
      where: leadWhere,
      include: {
        company:    { select: { id: true, name: true } },
        contact:    { select: { id: true, firstName: true, lastName: true } },
        leadSource: { select: { id: true, name: true, color: true } },
        owner:      { include: { user: { select: { name: true } } } },
        pipeline:   { select: { id: true, name: true, archivedAt: true } },
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

  // H2 — ensure any archived pipeline currently referenced by a loaded Lead
  // is still present in the editor's options, so reassignment is explicit.
  const activePipelineIds = new Set(activePipelines.map((p) => p.id));
  const missingPipelineIds = Array.from(
    new Set(
      leads
        .map((l) => l.pipelineId)
        .filter((pid) => !activePipelineIds.has(pid))
    )
  );
  const archivedReferencedPipelines = missingPipelineIds.length
    ? await prisma.pipeline.findMany({
        where: { organizationId: orgId, id: { in: missingPipelineIds } },
        include: {
          stages: {
            select: { id: true, name: true, sortOrder: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      })
    : [];

  const allEditorPipelines = [
    ...activePipelines.map((p) => ({ ...p, isArchived: false })),
    ...archivedReferencedPipelines.map((p) => ({ ...p, isArchived: true })),
  ];

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
    pipeline: { id: l.pipeline.id, name: l.pipeline.name },
    stage: l.stage,
  }));

  const choices = {
    pipelines: allEditorPipelines.map((p) => ({
      id: p.id,
      name: p.name,
      isArchived: p.isArchived,
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
    activePipelines.find((p) => p.isDefault)?.id ?? activePipelines[0]?.id;

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
        currentArchivedFilter={archivedFilter}
      />
    </div>
  );
}
