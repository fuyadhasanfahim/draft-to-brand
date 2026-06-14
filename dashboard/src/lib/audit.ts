import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Append a row to the AuditLog. Best-effort — never throws and never
 * blocks the surrounding mutation. Captures request metadata when called
 * from a request context.
 */
export async function logAudit(args: {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      ipAddress =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null;
      userAgent = h.get("user-agent") ?? null;
    } catch {
      /* not in a request context — leave nulls */
    }

    await prisma.auditLog.create({
      data: {
        organizationId: args.organizationId ?? null,
        actorUserId: args.actorUserId ?? null,
        action: args.action,
        resource: args.resource,
        resourceId: args.resourceId ?? null,
        metadata: (args.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write log", err);
  }
}
