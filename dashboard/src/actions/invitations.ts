"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { canAssignRole, loadActorContext } from "@/lib/permissions/policy";
import { generateInvitationToken } from "@/lib/auth/invitations";
import { checkAndConsumeEmailQuota } from "@/lib/auth/email-rate-limit";
import { sendEmail } from "@/lib/email";
import { EMAIL_SUBJECTS } from "@/lib/email/email-config";
import { InvitationEmail } from "@/emails";
import { logAudit } from "@/lib/audit";
import { inviteMemberSchema, type InviteMemberInput } from "@/lib/validators/members";
import { BRAND } from "@/lib/constants/brand";

const INVITATION_TTL_DAYS = 7;

type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

async function sendInviteEmailFor(invitationId: string) {
  const inv = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: { organization: true, role: true, createdBy: true },
  });
  if (!inv) return;

  const acceptUrl = `${BRAND.url}/sign-up?token=${inv.token}`;
  await sendEmail({
    to: inv.email,
    subject: `${EMAIL_SUBJECTS.welcome} – invitation`,
    react: InvitationEmail({
      inviterName: inv.createdBy?.name ?? undefined,
      recipientName: inv.recipientName ?? undefined,
      organizationName: inv.organization.name,
      roleName: inv.role.name,
      acceptUrl,
      expiresInDays: INVITATION_TTL_DAYS,
    }),
    tags: [{ name: "category", value: "auth_invitation" }],
  });
}

export async function inviteMemberAction(
  input: InviteMemberInput
): Promise<ActionResult<{ invitationId: string }>> {
  const session = await requireVerifiedSession();
  if (!(await can("members.invite"))) {
    return { ok: false, error: "You don't have permission to invite members." };
  }

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, roleId, branchId, departmentId, teamId, name } = parsed.data;

  // Cross-org reference + role-grant validation (Critical #1, #3).
  const actor = await loadActorContext(session.user.id, session.member.organizationId);
  const roleCheck = await canAssignRole(actor, roleId);
  if (!roleCheck.ok) return { ok: false, error: roleCheck.error };

  for (const [field, id, model] of [
    ["branch",     branchId,     prisma.branch] as const,
    ["department", departmentId, prisma.department] as const,
    ["team",       teamId,       prisma.team] as const,
  ]) {
    if (!id) continue;
    const found = await (model as { findFirst: (a: unknown) => Promise<{ id: string } | null> }).findFirst({
      where: { id, organizationId: session.member.organizationId },
      select: { id: true },
    });
    if (!found) return { ok: false, error: `${field[0].toUpperCase()}${field.slice(1)} not found in this workspace.` };
  }

  // Reject if the email is already an active member of THIS organization.
  const existingMember = await prisma.member.findFirst({
    where: {
      organizationId: session.member.organizationId,
      user: { email },
    },
  });
  if (existingMember) {
    return { ok: false, error: "This person is already a member of the workspace." };
  }

  const quota = await checkAndConsumeEmailQuota({
    identifier: email,
    scope: "INVITATION_SENT",
  });
  if (!quota.ok) return { ok: false, error: quota.message };

  const token = generateInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

  try {
    const invitation = await prisma.invitation.upsert({
      where: {
        organizationId_email: {
          organizationId: session.member.organizationId,
          email,
        },
      },
      update: {
        token,
        recipientName: name,
        roleId,
        branchId: branchId ?? null,
        departmentId: departmentId ?? null,
        teamId: teamId ?? null,
        status: "PENDING",
        expiresAt,
        acceptedAt: null,
        // Soft-deleted invitations come back to life on re-invite — the
        // original row's audit history is preserved while the recipient
        // gets a working link again.
        deletedAt: null,
        createdById: session.user.id,
      },
      create: {
        organizationId: session.member.organizationId,
        email,
        recipientName: name,
        token,
        roleId,
        branchId: branchId ?? null,
        departmentId: departmentId ?? null,
        teamId: teamId ?? null,
        status: "PENDING",
        expiresAt,
        createdById: session.user.id,
      },
    });

    await sendInviteEmailFor(invitation.id);

    await logAudit({
      organizationId: session.member.organizationId,
      actorUserId: session.user.id,
      action: "invitation.sent",
      resource: "invitation",
      resourceId: invitation.id,
      metadata: { email, roleId },
    });

    revalidatePath("/dashboard/members");
    return { ok: true, data: { invitationId: invitation.id } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "An invitation for this email already exists." };
    }
    console.error("[invitations] invite failed", err);
    return { ok: false, error: "Could not send invitation." };
  }
}

export async function resendInvitationAction(
  invitationId: string
): Promise<ActionResult> {
  const session = await requireVerifiedSession();
  if (!(await can("members.invite"))) {
    return { ok: false, error: "You don't have permission." };
  }

  const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!inv || inv.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Invitation not found." };
  }
  if (inv.status !== "PENDING") {
    return { ok: false, error: "Only pending invitations can be resent." };
  }

  const quota = await checkAndConsumeEmailQuota({
    identifier: inv.email,
    scope: "INVITATION_SENT",
  });
  if (!quota.ok) return { ok: false, error: quota.message };

  // Refresh expiry so the recipient gets a usable window from the resend.
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.invitation.update({
    where: { id: inv.id },
    data: { expiresAt },
  });

  await sendInviteEmailFor(inv.id);

  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "invitation.resent",
    resource: "invitation",
    resourceId: inv.id,
    metadata: { email: inv.email },
  });

  revalidatePath("/dashboard/members");
  return { ok: true };
}

/**
 * Cancel a pending invitation.
 *
 *   NO email is sent. NO resend quota is consumed. The token stays in the
 *   DB but its status flips to REVOKED, so `getValidInvitationByToken`
 *   rejects it. This is deliberate per the UX audit (Fix #2): cancel
 *   must be silent.
 */
export async function cancelInvitationAction(
  invitationId: string
): Promise<ActionResult> {
  const session = await requireVerifiedSession();
  if (!(await can("members.invite"))) {
    return { ok: false, error: "You don't have permission." };
  }

  const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!inv || inv.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Invitation not found." };
  }
  if (inv.status !== "PENDING") {
    return { ok: false, error: "Only pending invitations can be cancelled." };
  }

  await prisma.invitation.update({
    where: { id: inv.id },
    data: { status: "REVOKED" },
  });

  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "invitation.cancelled",
    resource: "invitation",
    resourceId: inv.id,
    metadata: { email: inv.email },
  });

  revalidatePath("/dashboard/members");
  return { ok: true };
}

/**
 * Re-open a previously cancelled or expired invitation.
 *
 *   Generates a fresh token (old one stops working), pushes the expiry
 *   out by the standard TTL, flips status back to PENDING. Does NOT send
 *   an email — the operator clicks Resend separately if desired (so the
 *   resend quota is consumed only when they actually want to spam the
 *   inbox).
 */
export async function reopenInvitationAction(
  invitationId: string
): Promise<ActionResult> {
  const session = await requireVerifiedSession();
  if (!(await can("members.invite"))) {
    return { ok: false, error: "You don't have permission." };
  }

  const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!inv || inv.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Invitation not found." };
  }
  if (inv.status !== "REVOKED" && inv.status !== "EXPIRED") {
    // PENDING is a no-op; ACCEPTED is final; DELETED stays a tombstone.
    return {
      ok: false,
      error:
        inv.status === "PENDING"
          ? "Invitation is already pending."
          : inv.status === "ACCEPTED"
            ? "Accepted invitations cannot be reopened."
            : "Deleted invitations cannot be reopened — invite the recipient again.",
    };
  }

  await prisma.invitation.update({
    where: { id: inv.id },
    data: {
      status: "PENDING",
      token: generateInvitationToken(),
      expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
      acceptedAt: null,
      deletedAt: null,
    },
  });

  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "invitation.reopened",
    resource: "invitation",
    resourceId: inv.id,
    metadata: { email: inv.email, previousStatus: inv.status },
  });

  revalidatePath("/dashboard/members");
  return { ok: true };
}

/**
 * Soft-delete an invitation row.
 *
 *   - Status flips to DELETED and `deletedAt` is stamped — the row stays
 *     in the database so audit trails (who invited whom as what role
 *     when) survive compliance, security, and abuse investigations.
 *   - The row disappears from every UI surface (the members page filters
 *     `status: { not: "DELETED" }`).
 *   - The token is wiped to a non-guessable random sentinel so the old
 *     URL can never be revived. (Keeping the column NOT NULL + unique
 *     means we can't just clear it; rotation neutralizes it instead.)
 *   - Pending invitations must be cancelled first — keeps a clear UX
 *     boundary between "stop this from being accepted" and "remove from
 *     view".
 *   - The unique (organizationId, email) constraint still lets admins
 *     re-invite the same email; `inviteMemberAction`'s upsert revives
 *     the soft-deleted row with a fresh token + cleared deletedAt.
 */
export async function deleteInvitationAction(
  invitationId: string
): Promise<ActionResult> {
  const session = await requireVerifiedSession();
  if (!(await can("members.invite"))) {
    return { ok: false, error: "You don't have permission." };
  }

  const inv = await prisma.invitation.findUnique({ where: { id: invitationId } });
  if (!inv || inv.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Invitation not found." };
  }
  if (inv.status === "PENDING") {
    return { ok: false, error: "Cancel the invitation before deleting it." };
  }
  if (inv.status === "DELETED") {
    return { ok: false, error: "Already deleted." };
  }

  await prisma.invitation.update({
    where: { id: inv.id },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
      // Rotate the token so the previous URL is permanently inert even if
      // some future code path forgets to filter by status.
      token: generateInvitationToken(),
    },
  });

  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "invitation.deleted",
    resource: "invitation",
    resourceId: inv.id,
    metadata: { email: inv.email, previousStatus: inv.status, soft: true },
  });

  revalidatePath("/dashboard/members");
  return { ok: true };
}

/**
 * Update a pending invitation in place (name, role, branch, dept, team).
 *
 * If the email changes, we generate a NEW token and reset the expiry —
 * the old link stops working. The recipient gets a fresh invitation row
 * (still the same DB id, but functionally a new invitation) and the audit
 * log records the previous email.
 *
 * NO email is sent automatically — the operator picks Resend if they
 * want to re-deliver. Keeps the resend quota under explicit control.
 */
export async function updateInvitationAction(
  input: {
    id: string;
    name?: string | null;
    email?: string;
    roleId?: string;
    branchId?: string | null;
    departmentId?: string | null;
    teamId?: string | null;
  }
): Promise<ActionResult> {
  const session = await requireVerifiedSession();
  if (!(await can("members.invite"))) {
    return { ok: false, error: "You don't have permission." };
  }

  const inv = await prisma.invitation.findUnique({ where: { id: input.id } });
  if (!inv || inv.organizationId !== session.member.organizationId) {
    return { ok: false, error: "Invitation not found." };
  }
  if (inv.status !== "PENDING") {
    return { ok: false, error: "Only pending invitations can be edited." };
  }

  // Cross-org reference validation (same hardening as inviteMemberAction).
  if (input.roleId) {
    const roleCheck = await canAssignRole(
      await loadActorContext(session.user.id, session.member.organizationId),
      input.roleId
    );
    if (!roleCheck.ok) return { ok: false, error: roleCheck.error };
  }
  for (const [field, id, model] of [
    ["branch",     input.branchId,     prisma.branch] as const,
    ["department", input.departmentId, prisma.department] as const,
    ["team",       input.teamId,       prisma.team] as const,
  ]) {
    if (!id) continue;
    const found = await (model as { findFirst: (a: unknown) => Promise<{ id: string } | null> }).findFirst({
      where: { id, organizationId: session.member.organizationId },
      select: { id: true },
    });
    if (!found) return { ok: false, error: `${field[0].toUpperCase()}${field.slice(1)} not found in this workspace.` };
  }

  const emailChanged =
    typeof input.email === "string" &&
    input.email.toLowerCase() !== inv.email.toLowerCase();

  try {
    await prisma.invitation.update({
      where: { id: inv.id },
      data: {
        recipientName: input.name ?? inv.recipientName,
        email: input.email ?? inv.email,
        roleId: input.roleId ?? inv.roleId,
        branchId: input.branchId !== undefined ? input.branchId : inv.branchId,
        departmentId:
          input.departmentId !== undefined ? input.departmentId : inv.departmentId,
        teamId: input.teamId !== undefined ? input.teamId : inv.teamId,
        // Fix #4: email change → old token must die.
        ...(emailChanged
          ? {
              token: generateInvitationToken(),
              expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
            }
          : {}),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Another pending invitation already exists for that email." };
    }
    console.error("[invitations] update failed", err);
    return { ok: false, error: "Could not update invitation." };
  }

  await logAudit({
    organizationId: session.member.organizationId,
    actorUserId: session.user.id,
    action: "invitation.updated",
    resource: "invitation",
    resourceId: inv.id,
    metadata: emailChanged
      ? { previousEmail: inv.email, newEmail: input.email, tokenRotated: true }
      : { changed: Object.keys(input).filter((k) => k !== "id") },
  });

  revalidatePath("/dashboard/members");
  return { ok: true };
}
