import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
export { AUDIT_RESOURCES, type AuditResource } from "./constants";

/**
 * Centralized audit-log query so the page view and the CSV export use the
 * exact same filters, in the exact same order, against the exact same
 * organization-scoped rowset.
 */

export type AuditFilters = {
  /** Free-text — matches actor name / email / action / resourceId (case-insensitive). */
  q?: string;
  /** Exact match on the `resource` column. */
  resource?: string;
  /** Exact prefix match on the `action` column (e.g. "member" matches member.*). */
  actionPrefix?: string;
  from?: Date;
  to?: Date;
};

export type AuditRow = Awaited<ReturnType<typeof loadAuditPage>>["rows"][number];

function buildWhere(orgId: string, f: AuditFilters): Prisma.AuditLogWhereInput {
  const and: Prisma.AuditLogWhereInput[] = [{ organizationId: orgId }];

  if (f.resource) and.push({ resource: f.resource });

  if (f.actionPrefix) {
    and.push({ action: { startsWith: f.actionPrefix } });
  }

  if (f.from || f.to) {
    and.push({
      createdAt: {
        ...(f.from ? { gte: f.from } : {}),
        ...(f.to ? { lte: f.to } : {}),
      },
    });
  }

  if (f.q && f.q.trim().length > 0) {
    const q = f.q.trim();
    and.push({
      OR: [
        { action: { contains: q, mode: "insensitive" } },
        { resource: { contains: q, mode: "insensitive" } },
        { resourceId: { contains: q, mode: "insensitive" } },
        { actor: { name: { contains: q, mode: "insensitive" } } },
        { actor: { email: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  return { AND: and };
}

export async function loadAuditPage(args: {
  organizationId: string;
  filters: AuditFilters;
  page: number;
  pageSize: number;
}) {
  const where = buildWhere(args.organizationId, args.filters);
  const skip = Math.max(0, (args.page - 1) * args.pageSize);

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: args.pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total };
}

/**
 * Loads up to `cap` matching rows for CSV export. The cap protects the DB
 * and memory if someone exports a year of data on a hot tenant; if they
 * hit the cap we tell the user in the UI.
 */
export async function loadAuditForExport(args: {
  organizationId: string;
  filters: AuditFilters;
  cap?: number;
}) {
  const where = buildWhere(args.organizationId, args.filters);
  const cap = args.cap ?? 10_000;
  return prisma.auditLog.findMany({
    where,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: cap,
  });
}
