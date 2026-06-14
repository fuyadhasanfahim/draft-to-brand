import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { PermissionEffect, type Invitation, type Role } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions/registry";

export type ValidatedInvitation = Invitation & { role: Role };

/**
 * Looks up an invitation by token and asserts it is still usable.
 * Eagerly transitions expired invitations to status=EXPIRED so the row
 * reflects reality the next time someone reads it.
 */
export async function getValidInvitationByToken(
  token: string | null | undefined
): Promise<ValidatedInvitation | null> {
  if (!token) return null;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { role: true },
  });
  if (!invitation) return null;
  if (invitation.status !== "PENDING") return null;

  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  return invitation;
}

/**
 * Returns a usable invitation for the given email. Used by the signup
 * `before` hook to enforce invitation-only registration server-side.
 */
export async function getPendingInvitationByEmail(
  email: string
): Promise<ValidatedInvitation | null> {
  const invitation = await prisma.invitation.findFirst({
    where: { email: email.toLowerCase(), status: "PENDING" },
    include: { role: true },
    orderBy: { createdAt: "desc" },
  });
  if (!invitation) return null;
  if (invitation.expiresAt.getTime() < Date.now()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }
  return invitation;
}

/**
 * Materializes an invitation into a Member row + (optionally) direct
 * permission grants, and marks the invitation accepted.
 * Atomic.
 */
export async function acceptInvitationForUser(args: {
  invitationId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: { id: args.invitationId },
    });
    if (!invitation || invitation.status !== "PENDING") {
      throw new Error("Invitation is no longer valid");
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("Invitation has expired");
    }

    const existing = await tx.member.findUnique({
      where: {
        userId_organizationId: {
          userId: args.userId,
          organizationId: invitation.organizationId,
        },
      },
    });

    if (!existing) {
      await tx.member.create({
        data: {
          userId: args.userId,
          organizationId: invitation.organizationId,
          roleId: invitation.roleId,
          branchId: invitation.branchId,
          departmentId: invitation.departmentId,
          teamId: invitation.teamId,
          status: "ACTIVE",
        },
      });
    }

    // Optional per-invitation permission overrides — stored as ALLOW grants.
    const overrideKeys = Array.isArray(invitation.permissions)
      ? (invitation.permissions as PermissionKey[])
      : [];
    if (overrideKeys.length > 0) {
      const perms = await tx.permission.findMany({
        where: { key: { in: overrideKeys } },
      });
      for (const p of perms) {
        await tx.userPermission.upsert({
          where: {
            userId_organizationId_permissionId: {
              userId: args.userId,
              organizationId: invitation.organizationId,
              permissionId: p.id,
            },
          },
          update: { effect: PermissionEffect.ALLOW },
          create: {
            userId: args.userId,
            organizationId: invitation.organizationId,
            permissionId: p.id,
            effect: PermissionEffect.ALLOW,
            reason: `invitation:${invitation.id}`,
          },
        });
      }
    }

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        organizationId: invitation.organizationId,
        actorUserId: args.userId,
        action: "invitation.accepted",
        resource: "invitation",
        resourceId: invitation.id,
        metadata: { email: invitation.email },
      },
    });
  });
}

/** Generates a URL-safe random invitation token. */
export function generateInvitationToken(): string {
  // 32 bytes → 43 chars base64url. Plenty of entropy for an invitation link.
  return randomBytes(32).toString("base64url");
}
