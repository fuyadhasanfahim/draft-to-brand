"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { noteSchema, type NoteInput } from "@/lib/validators/crm";

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function loadOwnedNote(noteId: string, orgId: string) {
  return prisma.note.findFirst({
    where: { id: noteId, organizationId: orgId },
  });
}

function revalidateForNote(args: { companyId: string | null; contactId: string | null }) {
  if (args.companyId) revalidatePath(`/dashboard/companies/${args.companyId}`);
  if (args.contactId) {
    revalidatePath(`/dashboard/contacts`);
    // Future: /dashboard/contacts/[id]
  }
}

export async function createNoteAction(input: NoteInput): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("notes.create"))) return { ok: false, error: "No permission." };
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const orgId = session.member.organizationId;

  // Cross-org validation for whichever target was provided.
  if (parsed.data.companyId) {
    const c = await prisma.company.findFirst({
      where: { id: parsed.data.companyId, organizationId: orgId },
      select: { id: true },
    });
    if (!c) return { ok: false, error: "Company not found in this workspace." };
  }
  if (parsed.data.contactId) {
    const c = await prisma.contact.findFirst({
      where: { id: parsed.data.contactId, organizationId: orgId },
      select: { id: true },
    });
    if (!c) return { ok: false, error: "Contact not found in this workspace." };
  }

  const note = await prisma.note.create({
    data: {
      organizationId: orgId,
      companyId: parsed.data.companyId ?? null,
      contactId: parsed.data.contactId ?? null,
      content: parsed.data.content,
      createdById: session.user.id,
    },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "note.created",
    resource: "note",
    resourceId: note.id,
    metadata: {
      companyId: note.companyId,
      contactId: note.contactId,
    },
  });

  revalidateForNote(note);
  return { ok: true, id: note.id };
}

export async function updateNoteAction(input: {
  id: string;
  content: string;
}): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("notes.edit"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;
  const existing = await loadOwnedNote(input.id, orgId);
  if (!existing) return { ok: false, error: "Note not found." };

  // Authors can always edit their own. Other users need notes.edit
  // (which we already checked above), so this is the chokepoint:
  // explicit deny for cross-author edits would happen here. Phase 2A
  // policy: anyone with notes.edit can edit any note — keeps the UX
  // simple. Future: introduce notes.edit.own vs notes.edit.any.
  void existing.createdById;

  const content = input.content.trim();
  if (!content) return { ok: false, error: "Note can't be empty." };
  if (content.length > 4_000) return { ok: false, error: "Note too long." };

  await prisma.note.update({
    where: { id: existing.id },
    data: { content },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "note.updated",
    resource: "note",
    resourceId: existing.id,
  });
  revalidateForNote(existing);
  return { ok: true };
}

export async function deleteNoteAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("notes.delete"))) return { ok: false, error: "No permission." };
  const orgId = session.member.organizationId;
  const existing = await loadOwnedNote(id, orgId);
  if (!existing) return { ok: false, error: "Note not found." };

  await prisma.note.delete({ where: { id: existing.id } });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "note.deleted",
    resource: "note",
    resourceId: id,
    metadata: { companyId: existing.companyId, contactId: existing.contactId },
  });
  revalidateForNote(existing);
  return { ok: true };
}
