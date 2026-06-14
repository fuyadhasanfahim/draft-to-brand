"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import {
  canAssignRole,
  canManageMember,
  loadActorContext,
} from "@/lib/permissions/policy";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  updateMemberSchema,
  type UpdateMemberInput,
} from "@/lib/validators/members";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Verifies that a referenced row (branch / department / team) belongs to the
 * actor's organization. Returns null if it does, an error string otherwise.
 * Pass `null`/`undefined` to skip — the field is optional.
 */
async function assertSameOrg(
  organizationId: string,
  refs: {
    branchId?: string | null;
    departmentId?: string | null;
    teamId?: string | null;
  }
): Promise<string | null> {
  const checks: Promise<string | null>[] = [];
  if (refs.branchId) {
    checks.push(
      prisma.branch
        .findFirst({ where: { id: refs.branchId, organizationId }, select: { id: true } })
        .then((r) => (r ? null : "Branch not found in this workspace."))
    );
  }
  if (refs.departmentId) {
    checks.push(
      prisma.department
        .findFirst({
          where: { id: refs.departmentId, organizationId },
          select: { id: true },
        })
        .then((r) => (r ? null : "Department not found in this workspace."))
    );
  }
  if (refs.teamId) {
    checks.push(
      prisma.team
        .findFirst({ where: { id: refs.teamId, organizationId }, select: { id: true } })
        .then((r) => (r ? null : "Team not found in this workspace."))
    );
  }
  const results = await Promise.all(checks);
  return results.find((r) => r !== null) ?? null;
}

export async function updateMemberAction(
  input: UpdateMemberInput
): Promise<ActionResult> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!(await can("members.edit"))) return { ok: false, error: "No permission." };

  const session = await requireVerifiedSession();
  const actor = await loadActorContext(session.user.id, session.member.organizationId);

  // (a) Can the actor manage this specific member at all?
  const manage = await canManageMember(actor, parsed.data.memberId);
  if (!manage.ok) return { ok: false, error: manage.error };

  // (b) Can the actor grant the role they picked?
  const roleCheck = await canAssignRole(actor, parsed.data.roleId);
  if (!roleCheck.ok) return { ok: false, error: roleCheck.error };

  // (c) Are the referenced branch/dept/team in the actor's org?
  const refErr = await assertSameOrg(actor.organizationId, parsed.data);
  if (refErr) return { ok: false, error: refErr };

  // Load target for the sole-Owner guard + audit metadata.
  const target = await prisma.member.findFirst({
    where: { id: parsed.data.memberId, organizationId: actor.organizationId },
    include: { role: { select: { slug: true, id: true } } },
  });
  if (!target) return { ok: false, error: "Member not found." };

  // Sole-Owner self-demotion guard.
  if (
    target.userId === actor.userId &&
    target.role.slug === "owner" &&
    parsed.data.roleId !== target.role.id
  ) {
    const otherOwners = await prisma.member.count({
      where: {
        organizationId: actor.organizationId,
        role: { slug: "owner" },
        userId: { not: actor.userId },
        status: "ACTIVE",
      },
    });
    if (otherOwners === 0) {
      return {
        ok: false,
        error: "You're the sole Owner. Promote another member to Owner first.",
      };
    }
  }

  await prisma.member.update({
    where: { id: target.id },
    data: {
      roleId: parsed.data.roleId,
      branchId: parsed.data.branchId ?? null,
      departmentId: parsed.data.departmentId ?? null,
      teamId: parsed.data.teamId ?? null,
      jobTitle: parsed.data.jobTitle ?? null,
    },
  });

  await logAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    action: "member.updated",
    resource: "member",
    resourceId: target.id,
  });

  revalidatePath("/dashboard/members");
  return { ok: true };
}

export async function suspendMemberAction(memberId: string): Promise<ActionResult> {
  if (!(await can("members.edit"))) return { ok: false, error: "No permission." };
  const session = await requireVerifiedSession();
  const actor = await loadActorContext(session.user.id, session.member.organizationId);

  const manage = await canManageMember(actor, memberId);
  if (!manage.ok) return { ok: false, error: manage.error };
  if (manage.targetIsOwner) return { ok: false, error: "Owners cannot be suspended." };

  const target = await prisma.member.findFirst({
    where: { id: memberId, organizationId: actor.organizationId },
  });
  if (!target) return { ok: false, error: "Member not found." };
  if (target.userId === actor.userId) {
    return { ok: false, error: "You can't suspend yourself." };
  }

  await prisma.member.update({ where: { id: target.id }, data: { status: "SUSPENDED" } });
  await logAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    action: "member.suspended",
    resource: "member",
    resourceId: target.id,
  });
  revalidatePath("/dashboard/members");
  return { ok: true };
}

export async function activateMemberAction(memberId: string): Promise<ActionResult> {
  if (!(await can("members.edit"))) return { ok: false, error: "No permission." };
  const session = await requireVerifiedSession();
  const actor = await loadActorContext(session.user.id, session.member.organizationId);

  const manage = await canManageMember(actor, memberId);
  if (!manage.ok) return { ok: false, error: manage.error };

  const target = await prisma.member.findFirst({
    where: { id: memberId, organizationId: actor.organizationId },
  });
  if (!target) return { ok: false, error: "Member not found." };

  await prisma.member.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
  await logAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    action: "member.activated",
    resource: "member",
    resourceId: target.id,
  });
  revalidatePath("/dashboard/members");
  return { ok: true };
}

export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  if (!(await can("members.remove"))) return { ok: false, error: "No permission." };
  const session = await requireVerifiedSession();
  const actor = await loadActorContext(session.user.id, session.member.organizationId);

  const manage = await canManageMember(actor, memberId);
  if (!manage.ok) return { ok: false, error: manage.error };
  if (manage.targetIsOwner) return { ok: false, error: "Owners cannot be removed." };

  const target = await prisma.member.findFirst({
    where: { id: memberId, organizationId: actor.organizationId },
  });
  if (!target) return { ok: false, error: "Member not found." };
  if (target.userId === actor.userId) {
    return { ok: false, error: "You can't remove yourself." };
  }

  await prisma.member.update({ where: { id: target.id }, data: { status: "ARCHIVED" } });
  await logAudit({
    organizationId: actor.organizationId,
    actorUserId: actor.userId,
    action: "member.removed",
    resource: "member",
    resourceId: target.id,
  });
  revalidatePath("/dashboard/members");
  return { ok: true };
}
