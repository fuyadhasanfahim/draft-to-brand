"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  IconCheck,
  IconDots,
  IconEdit,
  IconNote,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  Textarea,
  useToast,
} from "@/components/ui";
import {
  createNoteAction,
  deleteNoteAction,
  updateNoteAction,
} from "@/actions/notes";

export type NoteRow = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  createdBy: { name: string; image: string | null } | null;
};

export type NotePermissions = {
  /** Current viewer's user id — used to compute per-note ownership. */
  currentUserId: string;
  canCreate: boolean;
  canEditOwn: boolean;
  canEditAny: boolean;
  canDeleteOwn: boolean;
  canDeleteAny: boolean;
};

export function NotesSection({
  notes,
  companyId,
  contactId,
  permissions,
}: {
  notes: NoteRow[];
  companyId?: string;
  contactId?: string;
  permissions: NotePermissions;
}) {
  const { canCreate } = permissions;
  const router = useRouter();
  const { toast } = useToast();
  const [draft, setDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);

  const post = async () => {
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    const res = await createNoteAction({
      content,
      companyId: companyId ?? null,
      contactId: contactId ?? null,
    });
    setPosting(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't post", description: res.error });
      return;
    }
    setDraft("");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {canCreate ? (
        <div className="surface-card p-3 flex flex-col gap-2">
          <Textarea
            placeholder="Write a note…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
          />
          <div className="flex items-center justify-end">
            <Button
              size="sm"
              variant="primary"
              loading={posting}
              disabled={!draft.trim()}
              onClick={post}
            >
              Post note
            </Button>
          </div>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <div className="surface-card flex items-center gap-3 px-5 py-8 text-center justify-center">
          <IconNote size={18} className="text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No notes yet. Capture context here so the next person on this account isn&rsquo;t starting cold.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((n) => {
            // Per-note resolution: ownership-aware.
            const isAuthor = n.createdById === permissions.currentUserId;
            const canEditThis =
              permissions.canEditAny || (isAuthor && permissions.canEditOwn);
            const canDeleteThis =
              permissions.canDeleteAny || (isAuthor && permissions.canDeleteOwn);
            return (
              <li key={n.id}>
                <NoteCard
                  note={n}
                  canEdit={canEditThis}
                  canDelete={canDeleteThis}
                  onChange={() => router.refresh()}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NoteCard({
  note,
  canEdit,
  canDelete,
  onChange,
}: {
  note: NoteRow;
  canEdit: boolean;
  canDelete: boolean;
  onChange: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(note.content);
  const [busy, setBusy] = React.useState(false);

  const save = async () => {
    setBusy(true);
    const res = await updateNoteAction({ id: note.id, content: value });
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    setEditing(false);
    onChange();
  };

  const remove = async () => {
    if (!confirm("Delete this note? This can't be undone.")) return;
    setBusy(true);
    const res = await deleteNoteAction(note.id);
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't delete", description: res.error });
      return;
    }
    onChange();
  };

  return (
    <article className="surface-card p-4">
      <header className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            name={note.createdBy?.name ?? "?"}
            src={note.createdBy?.image ?? undefined}
            size="sm"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[12px] font-medium text-[var(--color-foreground)] truncate">
              {note.createdBy?.name ?? "Unknown"}
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              {formatDistanceToNow(note.createdAt, { addSuffix: true })}
              {note.updatedAt.getTime() !== note.createdAt.getTime() ? " · edited" : ""}
            </span>
          </div>
        </div>
        {!editing && (canEdit || canDelete) ? (
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="icon-sm" aria-label="Note actions">
                <IconDots size={14} />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              {canEdit ? (
                <DropdownItem onSelect={() => setEditing(true)}>
                  <IconEdit size={14} /> Edit
                </DropdownItem>
              ) : null}
              {canDelete ? (
                <DropdownItem destructive onSelect={remove}>
                  <IconTrash size={14} /> Delete
                </DropdownItem>
              ) : null}
            </DropdownContent>
          </Dropdown>
        ) : null}
      </header>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            autoFocus
          />
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setValue(note.content);
              }}
              disabled={busy}
            >
              <IconX size={13} /> Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={save} loading={busy}>
              <IconCheck size={13} /> Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-foreground)] whitespace-pre-wrap leading-relaxed">
          {note.content}
        </p>
      )}
    </article>
  );
}
