"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  pipelineSchema,
  pipelineStageSchema,
  reorderStagesSchema,
  type PipelineInput,
  type PipelineStageInput,
  type ReorderStagesInput,
} from "@/lib/validators/leads";

type Result = { ok: true; id?: string } | { ok: false; error: string };

// ─── Pipeline ────────────────────────────────────────────────────────────

export async function upsertPipelineAction(input: PipelineInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("pipelines.manage"))) return { ok: false, error: "No permission." };
  const parsed = pipelineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    isDefault: parsed.data.isDefault ?? false,
  };

  try {
    let id: string;
    if (parsed.data.id) {
      const existing = await prisma.pipeline.findFirst({
        where: { id: parsed.data.id, organizationId: orgId },
      });
      if (!existing) return { ok: false, error: "Pipeline not found." };
      const updated = await prisma.$transaction(async (tx) => {
        if (data.isDefault) {
          await tx.pipeline.updateMany({
            where: { organizationId: orgId, NOT: { id: existing.id } },
            data: { isDefault: false },
          });
        }
        return tx.pipeline.update({ where: { id: existing.id }, data });
      });
      id = updated.id;
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "pipeline.updated",
        resource: "pipeline",
        resourceId: id,
        metadata: { name: updated.name, slug: updated.slug },
      });
    } else {
      const created = await prisma.$transaction(async (tx) => {
        if (data.isDefault) {
          await tx.pipeline.updateMany({
            where: { organizationId: orgId },
            data: { isDefault: false },
          });
        }
        return tx.pipeline.create({
          data: { ...data, organizationId: orgId },
        });
      });
      id = created.id;
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "pipeline.created",
        resource: "pipeline",
        resourceId: id,
        metadata: { name: created.name, slug: created.slug },
      });
    }
    revalidatePath("/dashboard/settings/pipelines");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A pipeline with that slug already exists." };
    }
    console.error("[pipelines] upsert failed", err);
    return { ok: false, error: "Could not save pipeline." };
  }
}

export async function archivePipelineAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("pipelines.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;
  const existing = await prisma.pipeline.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return { ok: false, error: "Pipeline not found." };

  await prisma.pipeline.update({
    where: { id },
    data: existing.archivedAt
      ? { archivedAt: null }
      : { archivedAt: new Date(), isDefault: false },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: existing.archivedAt ? "pipeline.restored" : "pipeline.archived",
    resource: "pipeline",
    resourceId: id,
  });
  revalidatePath("/dashboard/settings/pipelines");
  return { ok: true };
}

// ─── Pipeline Stage ──────────────────────────────────────────────────────

async function assertPipelineInOrg(pipelineId: string, organizationId: string) {
  const p = await prisma.pipeline.findFirst({
    where: { id: pipelineId, organizationId },
    select: { id: true },
  });
  return Boolean(p);
}

export async function upsertPipelineStageAction(input: PipelineStageInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("pipelines.manage"))) return { ok: false, error: "No permission." };
  const parsed = pipelineStageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  if (!(await assertPipelineInOrg(parsed.data.pipelineId, orgId))) {
    return { ok: false, error: "Pipeline not found in this workspace." };
  }

  const data = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    color: parsed.data.color ?? "#6b6e6e",
    sortOrder: parsed.data.sortOrder ?? 0,
    winProbability: parsed.data.winProbability ?? 0,
    outcome: parsed.data.outcome ?? "OPEN",
  };

  try {
    let id: string;
    if (parsed.data.id) {
      const existing = await prisma.pipelineStage.findFirst({
        where: { id: parsed.data.id, pipelineId: parsed.data.pipelineId },
      });
      if (!existing) return { ok: false, error: "Stage not found." };
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.pipelineStage.update({
          where: { id: existing.id },
          data,
        });
        // Lead.status is derived from the current stage's outcome. If we
        // just changed that outcome, re-sync every Lead sitting on this
        // stage so the derived status stays truthful.
        if (existing.outcome !== u.outcome) {
          await tx.lead.updateMany({
            where: { stageId: u.id },
            data: { status: u.outcome },
          });
        }
        return u;
      });
      id = updated.id;
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "stage.updated",
        resource: "pipeline_stage",
        resourceId: id,
        metadata: {
          name: updated.name,
          pipelineId: updated.pipelineId,
          outcome: updated.outcome,
        },
      });
    } else {
      // If no sortOrder supplied, append at the end.
      let sortOrder = data.sortOrder;
      if (!parsed.data.sortOrder) {
        const last = await prisma.pipelineStage.findFirst({
          where: { pipelineId: parsed.data.pipelineId },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        sortOrder = (last?.sortOrder ?? 0) + 10;
      }
      const created = await prisma.pipelineStage.create({
        data: { ...data, sortOrder, pipelineId: parsed.data.pipelineId },
      });
      id = created.id;
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "stage.created",
        resource: "pipeline_stage",
        resourceId: id,
        metadata: { name: created.name, pipelineId: created.pipelineId },
      });
    }
    revalidatePath("/dashboard/settings/pipelines");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A stage with that slug already exists in this pipeline." };
    }
    console.error("[pipelines] stage upsert failed", err);
    return { ok: false, error: "Could not save stage." };
  }
}

export async function reorderPipelineStagesAction(input: ReorderStagesInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("pipelines.manage"))) return { ok: false, error: "No permission." };
  const parsed = reorderStagesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  if (!(await assertPipelineInOrg(parsed.data.pipelineId, orgId))) {
    return { ok: false, error: "Pipeline not found in this workspace." };
  }

  // Ensure the payload covers exactly the stages of this pipeline — no
  // missing ids (would leave others at their old sortOrder and collide with
  // the new sequence) and no foreign ids (would touch unrelated rows).
  const allStages = await prisma.pipelineStage.findMany({
    where: { pipelineId: parsed.data.pipelineId },
    select: { id: true },
  });
  if (allStages.length !== parsed.data.stageIds.length) {
    return {
      ok: false,
      error: "Reorder must include every stage in this pipeline exactly once.",
    };
  }
  const allIds = new Set(allStages.map((s) => s.id));
  const payloadIds = new Set(parsed.data.stageIds);
  if (payloadIds.size !== parsed.data.stageIds.length) {
    return { ok: false, error: "Duplicate stage ids in reorder payload." };
  }
  for (const id of payloadIds) {
    if (!allIds.has(id)) {
      return { ok: false, error: "One or more stages don't belong to this pipeline." };
    }
  }

  await prisma.$transaction(
    parsed.data.stageIds.map((id, idx) =>
      prisma.pipelineStage.update({
        where: { id },
        data: { sortOrder: (idx + 1) * 10 },
      })
    )
  );

  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "pipeline.updated",
    resource: "pipeline",
    resourceId: parsed.data.pipelineId,
    metadata: { reorderedStageIds: parsed.data.stageIds },
  });
  revalidatePath("/dashboard/settings/pipelines");
  return { ok: true };
}

export async function deletePipelineStageAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("pipelines.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;

  const stage = await prisma.pipelineStage.findFirst({
    where: { id, pipeline: { organizationId: orgId } },
    include: { _count: { select: { leads: true } } },
  });
  if (!stage) return { ok: false, error: "Stage not found." };
  if (stage._count.leads > 0) {
    return { ok: false, error: "Move leads off this stage before deleting." };
  }

  await prisma.pipelineStage.delete({ where: { id } });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "stage.deleted",
    resource: "pipeline_stage",
    resourceId: id,
    metadata: { pipelineId: stage.pipelineId },
  });
  revalidatePath("/dashboard/settings/pipelines");
  return { ok: true };
}
