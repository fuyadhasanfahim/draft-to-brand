"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import {
  updateMemberSchema,
  type UpdateMemberInput,
} from "@/lib/validators/members";

type ActionResult = { ok: true } | { ok: false; error: string };

async function loadOwnMember(memberId: string) {
  const session = await requireVerifiedSession();
  const target = await prisma.member.findUnique({
    where: { id: memberId },
    include: { role: true, user: true },
  });
  if (!target || target.organizationId !== session.member.organizationId) {
    return { session, target: null as null };
  }
  return { session, target };
}

export async function updateMemberAction(
  input: UpdateMemberInput
): Promise<ActionResult> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!(await can("members.edit"))) return { ok: false, error: "No permission." };

  const { session, target } = await loadOwnMember(parsed.data.memberId);
  if (!target) return { ok: false, error: "Member not found." };

  // Don't allow demoting yourself out of Owner — keep an escape hatch for the
  // only Owner from accidentally locking the workspace.
  if (target.userId === session.user.id && target.role.slug === "owner" && parsed.data.roleId !== target.roleId) {
    const otherOwners = await prisma.member.count({
      where: {
        organizationId: target.organizationId,
        role: { slug: "owner" },
        userId: { not: target.userId },
        status: "ACTIVE",
      },
    });
    if (otherOwners === 0) {
      return { ok: false, error: "You're the sole Owner. Promote another member to Owner first." };
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
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "member.updated",
    resource: "member",
    resourceId: target.id,
  });

  revalidatePath("/dashboard/members");
  return { ok: true };
}

export async function suspendMemberAction(memberId: string): Promise<ActionResult> {
  if (!(await can("members.edit"))) return { ok: false, error: "No permission." };
  const { session, target } = await loadOwnMember(memberId);
  if (!target) return { ok: false, error: "Member not found." };
  if (target.userId === session.user.id) {
    return { ok: false, error: "You can't suspend yourself." };
  }
  if (target.role.slug === "owner") {
    return { ok: false, error: "Owners cannot be suspended." };
  }

  await prisma.member.update({
    where: { id: target.id },
    data: { status: "SUSPENDED" },
  });
  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "member.suspended",
    resource: "member",
    resourceId: target.id,
  });
  revalidatePath("/dashboard/members");
  return { ok: true };
}

export async function activateMemberAction(memberId: string): Promise<ActionResult> {
  if (!(await can("members.edit"))) return { ok: false, error: "No permission." };
  const { session, target } = await loadOwnMember(memberId);
  if (!target) return { ok: false, error: "Member not found." };

  await prisma.member.update({
    where: { id: target.id },
    data: { status: "ACTIVE" },
  });
  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "member.activated",
    resource: "member",
    resourceId: target.id,
  });
  revalidatePath("/dashboard/members");
  return { ok: true };
}

/** Soft-remove (status=ARCHIVED). Keeps audit trail intact. */
export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  if (!(await can("members.remove"))) return { ok: false, error: "No permission." };
  const { session, target } = await loadOwnMember(memberId);
  if (!target) return { ok: false, error: "Member not found." };
  if (target.userId === session.user.id) {
    return { ok: false, error: "You can't remove yourself." };
  }
  if (target.role.slug === "owner") {
    return { ok: false, error: "Owners cannot be removed." };
  }

  await prisma.member.update({
    where: { id: target.id },
    data: { status: "ARCHIVED" },
  });
  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "member.removed",
    resource: "member",
    resourceId: target.id,
  });
  revalidatePath("/dashboard/members");
  return { ok: true };
}
