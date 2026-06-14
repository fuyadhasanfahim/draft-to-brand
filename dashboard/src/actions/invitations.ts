"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
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
  const { email, roleId, branchId, departmentId, teamId } = parsed.data;

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
        roleId,
        branchId: branchId ?? null,
        departmentId: departmentId ?? null,
        teamId: teamId ?? null,
        status: "PENDING",
        expiresAt,
        acceptedAt: null,
        createdById: session.user.id,
      },
      create: {
        organizationId: session.member.organizationId,
        email,
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
