"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { tagSchema, type TagInput } from "@/lib/validators/crm";

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function upsertTagAction(
  input: TagInput
): Promise<Result<{ id: string; name: string; color: string }>> {
  const session = await requireVerifiedSession();
  if (!(await can("tags.manage"))) return { ok: false, error: "No permission." };
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  try {
    const row = parsed.data.id
      ? await (async () => {
          const existing = await prisma.tag.findFirst({
            where: { id: parsed.data.id!, organizationId: orgId },
          });
          if (!existing) throw new Error("Tag not found.");
          return prisma.tag.update({
            where: { id: existing.id },
            data: { name: parsed.data.name, color: parsed.data.color },
          });
        })()
      : await prisma.tag.create({
          data: {
            organizationId: orgId,
            name: parsed.data.name,
            color: parsed.data.color,
          },
        });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: parsed.data.id ? "tag.updated" : "tag.created",
      resource: "tag",
      resourceId: row.id,
      metadata: { name: row.name, color: row.color },
    });
    revalidatePath("/dashboard/companies");
    revalidatePath("/dashboard/contacts");
    return { ok: true, data: { id: row.id, name: row.name, color: row.color } };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "A tag with that name already exists." };
    }
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not save tag." };
  }
}

export async function deleteTagAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("tags.manage"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;

  const existing = await prisma.tag.findFirst({
    where: { id, organizationId: orgId },
  });
  if (!existing) return { ok: false, error: "Tag not found." };

  // Tag joins cascade on tag delete (per @relation onDelete: Cascade on
  // CompanyTag / ContactTag), so we don't need to clear them manually.
  await prisma.tag.delete({ where: { id } });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "tag.deleted",
    resource: "tag",
    resourceId: id,
    metadata: { name: existing.name },
  });
  revalidatePath("/dashboard/companies");
  revalidatePath("/dashboard/contacts");
  return { ok: true };
}
