"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { teamSchema, type TeamInput } from "@/lib/validators/org-graph";

type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function upsertTeamAction(input: TeamInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("teams.manage"))) return { ok: false, error: "No permission." };
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const data = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      branchId: parsed.data.branchId ?? null,
      departmentId: parsed.data.departmentId ?? null,
      teamLeadId: parsed.data.teamLeadId ?? null,
    };
    if (parsed.data.id) {
      const existing = await prisma.team.findUnique({ where: { id: parsed.data.id } });
      if (!existing || existing.organizationId !== session.member.organizationId) {
        return { ok: false, error: "Team not found." };
      }
      const updated = await prisma.team.update({ where: { id: existing.id }, data });
      await logAudit({
        organizationId: session.member.organizationId,
        actorUserId: session.user.id,
        action: "team.updated",
        resource: "team",
        resourceId: updated.id,
      });
      revalidatePath("/dashboard/teams");
      return { ok: true, id: updated.id };
    }
    const created = await prisma.team.create({
      data: { ...data, organizationId: session.member.organizationId },
    });
    await logAudit({
      organizationId: session.member.organizationId,
      actorUserId: session.user.id,
      action: "team.created",
      resource: "team",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/teams");
    return { ok: true, id: created.id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A team with that slug already exists." };
    }
    console.error("[teams] upsert failed", err);
    return { ok: false, error: "Could not save team." };
  }
}

export async function archiveTeamAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("teams.manage"))) return { ok: false, error: "No permission." };
  const existing = await prisma.team.findUnique({ where: { id } });
  if (!existing || existing.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Team not found." };
  }
  await prisma.team.update({
    where: { id },
    data: { archivedAt: existing.archivedAt ? null : new Date() },
  });
  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "team.restored" : "team.archived",
    resource: "team",
    resourceId: id,
  });
  revalidatePath("/dashboard/teams");
  return { ok: true };
}
