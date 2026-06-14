import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { loadAuditForExport, type AuditFilters } from "@/features/audit/query";

export const dynamic = "force-dynamic";

/**
 * GET /dashboard/audit/export?[q&resource&from&to]
 *
 * Streams a CSV of audit events scoped to the caller's organization,
 * respecting the same filters as the page. Hard-capped at 10k rows so
 * a single click can never DOS the database.
 *
 * Permission gate: `audit.view` server-side enforced. Anyone without it
 * gets a 404 — same response as `/dashboard/audit` itself so we don't
 * leak the existence of the endpoint to unauthorized callers.
 */
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!(await can("audit.view"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const parseDate = (v: string | null, endOfDay = false) => {
    if (!v) return undefined;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return undefined;
    if (endOfDay) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
  };
  const filters: AuditFilters = {
    q: sp.get("q") ?? undefined,
    resource: sp.get("resource") ?? undefined,
    actionPrefix: sp.get("action") ?? undefined,
    from: parseDate(sp.get("from")),
    to: parseDate(sp.get("to"), true),
  };

  const rows = await loadAuditForExport({
    organizationId: session.member.organizationId,
    filters,
    cap: 10_000,
  });

  const csv = toCsv(rows);
  const filename = `audit-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

type Row = Awaited<ReturnType<typeof loadAuditForExport>>[number];

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
  // Per RFC 4180: wrap in quotes if it contains a comma, quote, or newline;
  // double up internal quotes.
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Row[]): string {
  const header = [
    "timestamp",
    "actor_id",
    "actor_name",
    "actor_email",
    "action",
    "resource",
    "resource_id",
    "ip_address",
    "user_agent",
    "metadata",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.createdAt.toISOString(),
        r.actor?.id ?? "",
        r.actor?.name ?? "",
        r.actor?.email ?? "",
        r.action,
        r.resource,
        r.resourceId ?? "",
        r.ipAddress ?? "",
        r.userAgent ?? "",
        r.metadata ?? "",
      ]
        .map(escapeCsv)
        .join(",")
    );
  }
  // BOM so Excel opens UTF-8 cleanly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
