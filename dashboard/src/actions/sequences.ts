"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  sequenceSchema,
  sequenceActiveSchema,
  sequenceStepSchema,
  deleteStepSchema,
  attachSequenceSchema,
  type SequenceFormValues,
  type SequenceActiveInput,
  type SequenceStepFormValues,
  type DeleteStepInput,
  type AttachSequenceInput,
} from "@/lib/validators/sequences";

type Result = { ok: true; id?: string } | { ok: false; error: string };

/** Org-scoped sequence lookup — the cross-tenant guard every mutation needs. */
async function findOrgSequence(id: string, organizationId: string) {
  return prisma.emailSequence.findFirst({ where: { id, organizationId } });
}

function blankToNull(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

// ── Sequence identity ────────────────────────────────────────────────────────

export async function createSequenceAction(
  input: SequenceFormValues
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("sequences.create")) && !(await can("sequences.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = sequenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  try {
    const created = await prisma.emailSequence.create({
      data: {
        organizationId: orgId,
        name: parsed.data.name,
        description: blankToNull(parsed.data.description),
        createdById: session.user.id,
      },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "sequence.created",
      resource: "sequence",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/sequences");
    return { ok: true, id: created.id };
  } catch (err) {
    console.error("[sequences] create failed", err);
    return { ok: false, error: "Could not create sequence." };
  }
}

export async function updateSequenceAction(
  input: SequenceFormValues
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("sequences.edit")) && !(await can("sequences.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = sequenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!parsed.data.id) return { ok: false, error: "Sequence id is required." };
  const orgId = session.member.organizationId;

  const existing = await findOrgSequence(parsed.data.id, orgId);
  if (!existing) return { ok: false, error: "Sequence not found." };

  await prisma.emailSequence.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      description: blankToNull(parsed.data.description),
    },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "sequence.updated",
    resource: "sequence",
    resourceId: existing.id,
    metadata: { name: parsed.data.name },
  });
  revalidatePath("/dashboard/sequences");
  revalidatePath(`/dashboard/sequences/${existing.id}`);
  return { ok: true, id: existing.id };
}

/** Activate / pause a sequence (the isActive toggle). */
export async function setSequenceActiveAction(
  input: SequenceActiveInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("sequences.edit")) && !(await can("sequences.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = sequenceActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const existing = await findOrgSequence(parsed.data.id, orgId);
  if (!existing) return { ok: false, error: "Sequence not found." };

  await prisma.emailSequence.update({
    where: { id: existing.id },
    data: { isActive: parsed.data.isActive },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "sequence.updated",
    resource: "sequence",
    resourceId: existing.id,
    metadata: { isActive: parsed.data.isActive },
  });
  revalidatePath("/dashboard/sequences");
  revalidatePath(`/dashboard/sequences/${existing.id}`);
  return { ok: true, id: existing.id };
}

/** Soft-delete (archive) / restore — mirrors the campaign archive convention. */
export async function archiveSequenceAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("sequences.delete")) && !(await can("sequences.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const orgId = session.member.organizationId;

  const existing = await findOrgSequence(id, orgId);
  if (!existing) return { ok: false, error: "Sequence not found." };

  const archiving = !existing.archivedAt;
  await prisma.emailSequence.update({
    where: { id },
    data: { archivedAt: archiving ? new Date() : null },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: archiving ? "sequence.deleted" : "sequence.restored",
    resource: "sequence",
    resourceId: id,
  });
  revalidatePath("/dashboard/sequences");
  revalidatePath(`/dashboard/sequences/${id}`);
  return { ok: true };
}

// ── Steps ────────────────────────────────────────────────────────────────────

export async function upsertSequenceStepAction(
  input: SequenceStepFormValues
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("sequences.edit")) && !(await can("sequences.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = sequenceStepSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  // Sequence must belong to the org (cross-tenant guard).
  const sequence = await findOrgSequence(parsed.data.sequenceId, orgId);
  if (!sequence) return { ok: false, error: "Sequence not found." };

  try {
    if (parsed.data.id) {
      const existing = await prisma.emailSequenceStep.findFirst({
        where: { id: parsed.data.id, sequenceId: sequence.id },
        select: { id: true },
      });
      if (!existing) return { ok: false, error: "Step not found." };

      await prisma.emailSequenceStep.update({
        where: { id: existing.id },
        data: {
          delayDays: parsed.data.delayDays,
          subject: parsed.data.subject,
          body: parsed.data.body,
          condition: parsed.data.condition,
        },
      });
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "sequence.updated",
        resource: "sequence",
        resourceId: sequence.id,
        metadata: { stepId: existing.id, change: "step_updated" },
      });
      revalidatePath(`/dashboard/sequences/${sequence.id}`);
      return { ok: true, id: existing.id };
    }

    // Create — append after the current highest stepNumber.
    const max = await prisma.emailSequenceStep.aggregate({
      where: { sequenceId: sequence.id },
      _max: { stepNumber: true },
    });
    const stepNumber = (max._max.stepNumber ?? 0) + 1;

    const created = await prisma.emailSequenceStep.create({
      data: {
        sequenceId: sequence.id,
        stepNumber,
        delayDays: parsed.data.delayDays,
        subject: parsed.data.subject,
        body: parsed.data.body,
        condition: parsed.data.condition,
      },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "sequence.updated",
      resource: "sequence",
      resourceId: sequence.id,
      metadata: { stepId: created.id, stepNumber, change: "step_added" },
    });
    revalidatePath(`/dashboard/sequences/${sequence.id}`);
    return { ok: true, id: created.id };
  } catch (err) {
    console.error("[sequences] upsert step failed", err);
    return { ok: false, error: "Could not save step." };
  }
}

export async function deleteSequenceStepAction(
  input: DeleteStepInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("sequences.edit")) && !(await can("sequences.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = deleteStepSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const step = await prisma.emailSequenceStep.findFirst({
    where: { id: parsed.data.stepId, sequence: { organizationId: orgId } },
    select: { id: true, sequenceId: true },
  });
  if (!step) return { ok: false, error: "Step not found." };

  await prisma.emailSequenceStep.delete({ where: { id: step.id } });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "sequence.updated",
    resource: "sequence",
    resourceId: step.sequenceId,
    metadata: { stepId: step.id, change: "step_deleted" },
  });
  revalidatePath(`/dashboard/sequences/${step.sequenceId}`);
  return { ok: true };
}

// ── Attach to a campaign ───────────────────────────────────────────────────────

/**
 * Attach (or detach) a sequence to a campaign. This is a campaign mutation, so
 * it's gated on `campaigns.edit`. Only meaningful before send (enrollment
 * happens at send time) — the UI only exposes it for DRAFT campaigns.
 */
export async function attachSequenceAction(
  input: AttachSequenceInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.edit")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = attachSequenceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: parsed.data.campaignId, organizationId: orgId },
    select: { id: true },
  });
  if (!campaign) return { ok: false, error: "Campaign not found." };

  if (parsed.data.sequenceId) {
    const sequence = await findOrgSequence(parsed.data.sequenceId, orgId);
    if (!sequence) return { ok: false, error: "Sequence not found in this workspace." };
  }

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { sequenceId: parsed.data.sequenceId },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "campaign.updated",
    resource: "campaign",
    resourceId: campaign.id,
    metadata: { sequenceId: parsed.data.sequenceId },
  });
  revalidatePath(`/dashboard/campaigns/${campaign.id}`);
  return { ok: true, id: campaign.id };
}
