"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAuthUser, getActiveMember } from "@/lib/auth/session";
import {
  createWorkspaceSchema,
  type CreateWorkspaceInput,
} from "@/lib/validators/onboarding";
import { PERMISSIONS } from "@/lib/permissions/registry";

export type CreateWorkspaceResult =
  | { ok: true; organizationId: string; slug: string }
  | { ok: false; error: string; field?: keyof CreateWorkspaceInput };

const MAX_SLUG_ATTEMPTS = 5;

/**
 * Self-service workspace creation for onboarding.
 *
 * Idempotency: if the caller already has an active membership, we short-circuit
 * with their existing org — protects against accidental double-submits creating
 * orphan workspaces.
 *
 * Atomicity: organization, owner role + permission grants, default
 * branch/department/team, and the owner Member row are created in a single
 * transaction. Any failure rolls all of it back.
 *
 * Slug collisions are auto-resolved by suffixing `-2`, `-3`, … up to a small
 * cap; we never silently overwrite another workspace's slug.
 */
export async function createWorkspaceAction(
  input: CreateWorkspaceInput
): Promise<CreateWorkspaceResult> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  // Hard server-side gate. Even though the UI hides the form behind the
  // verification modal, anyone hitting this action directly is rejected.
  if (!user.emailVerified) {
    return { ok: false, error: "Verify your email before creating a workspace." };
  }

  const existing = await getActiveMember();
  if (existing) {
    return { ok: true, organizationId: existing.organizationId, slug: existing.organization.slug };
  }

  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: (issue?.path[0] as keyof CreateWorkspaceInput) ?? undefined,
    };
  }
  const { name, slug: requestedSlug } = parsed.data;

  // Cache the full permission registry once — we re-seed it inside the txn
  // (upsert) so a brand-new database without `npm run db:seed` still works.
  const allPermissions = await prisma.$transaction(
    PERMISSIONS.map((p) =>
      prisma.permission.upsert({
        where: { key: p.key },
        update: { resource: p.resource, action: p.action, description: p.description },
        create: p,
      })
    )
  );

  try {
    const result = await prisma.$transaction(async (tx) => {
      const slug = await pickAvailableSlug(tx, requestedSlug);

      const org = await tx.organization.create({
        data: { name, slug },
      });

      const ownerRole = await tx.role.create({
        data: {
          organizationId: org.id,
          slug: "owner",
          name: "Owner",
          description: "Full unrestricted access to the organization.",
          isSystem: true,
          priority: 100,
        },
      });

      await tx.rolePermission.createMany({
        data: allPermissions.map((p) => ({
          roleId: ownerRole.id,
          permissionId: p.id,
        })),
        skipDuplicates: true,
      });

      const branch = await tx.branch.create({
        data: {
          organizationId: org.id,
          name: "Main Branch",
          slug: "main-branch",
          isHeadquarter: true,
        },
      });

      const department = await tx.department.create({
        data: {
          organizationId: org.id,
          branchId: branch.id,
          name: "Operations",
          slug: "operations",
        },
      });

      const team = await tx.team.create({
        data: {
          organizationId: org.id,
          branchId: branch.id,
          departmentId: department.id,
          name: "Core Team",
          slug: "core-team",
        },
      });

      await tx.member.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          branchId: branch.id,
          departmentId: department.id,
          teamId: team.id,
          roleId: ownerRole.id,
          status: "ACTIVE",
          jobTitle: "Owner",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          actorUserId: user.id,
          action: "workspace.created",
          resource: "organization",
          resourceId: org.id,
          metadata: { name: org.name, slug: org.slug },
        },
      });

      return org;
    });

    revalidatePath("/dashboard", "layout");
    return { ok: true, organizationId: result.id, slug: result.slug };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "That slug is already taken", field: "slug" };
    }
    console.error("[workspace] create failed", err);
    return { ok: false, error: "Could not create workspace. Please try again." };
  }
}

async function pickAvailableSlug(
  tx: Prisma.TransactionClient,
  base: string
): Promise<string> {
  for (let i = 0; i < MAX_SLUG_ATTEMPTS; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const taken = await tx.organization.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
  }
  // Fall back to a timestamp suffix; uniqueness all but guaranteed.
  return `${base}-${Date.now().toString(36)}`;
}
