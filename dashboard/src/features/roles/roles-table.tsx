"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { IconCopy, IconDots, IconEdit, IconShieldLock, IconTrash } from "@tabler/icons-react";
import type { Role } from "@prisma/client";
import {
  Badge,
  Button,
  DataTable,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  Field,
  Input,
  Modal,
  useToast,
} from "@/components/ui";
import {
  cloneRoleAction,
  deleteRoleAction,
} from "@/actions/roles";
import { slugify } from "@/lib/validators/onboarding";
import { RoleFormDialog } from "./role-form-dialog";

export type RoleRow = Role & {
  permissionKeys: string[];
  memberCount: number;
};

export function RolesTable({
  roles,
  canManage,
}: {
  roles: RoleRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [editTarget, setEditTarget] = React.useState<RoleRow | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [cloneSource, setCloneSource] = React.useState<RoleRow | null>(null);

  const columns = React.useMemo<ColumnDef<RoleRow, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (r) => r.name,
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--color-foreground)]">{row.original.name}</span>
            {row.original.isSystem ? (
              <Badge variant="neutral">
                <IconShieldLock size={11} /> System
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: "slug",
        accessorFn: (r) => r.slug,
        header: "Slug",
        cell: ({ row }) => <code className="text-xs text-[var(--color-muted-foreground)]">{row.original.slug}</code>,
      },
      {
        id: "permissions",
        accessorFn: (r) => r.permissionKeys.length,
        header: "Permissions",
        cell: ({ row }) => (
          <span className="text-[var(--color-muted-foreground)] text-[12px]">
            {row.original.permissionKeys.length} granted
          </span>
        ),
      },
      {
        id: "members",
        accessorFn: (r) => r.memberCount,
        header: "Members",
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          canManage ? <RowMenu role={row.original} onEdit={() => setEditTarget(row.original)} onClone={() => setCloneSource(row.original)} onDeleted={() => router.refresh()} /> : null,
      },
    ],
    [canManage, router]
  );

  return (
    <>
      <div className="mb-3 flex justify-end">
        {canManage ? (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            Create role
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={roles}
        searchPlaceholder="Search roles…"
        empty={{ title: "No roles defined", description: "Seed your workspace with system roles or create your own." }}
      />

      {canManage ? (
        <>
          <RoleFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            mode={{ kind: "create" }}
          />
          {editTarget ? (
            <RoleFormDialog
              open={!!editTarget}
              onOpenChange={(v) => !v && setEditTarget(null)}
              mode={{
                kind: "edit",
                role: {
                  id: editTarget.id,
                  name: editTarget.name,
                  slug: editTarget.slug,
                  description: editTarget.description,
                  isSystem: editTarget.isSystem,
                  permissionKeys: editTarget.permissionKeys,
                },
              }}
            />
          ) : null}
          {cloneSource ? (
            <CloneDialog
              source={cloneSource}
              open={!!cloneSource}
              onOpenChange={(v) => !v && setCloneSource(null)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );

  function RowMenu({
    role,
    onEdit,
    onClone,
  }: {
    role: RoleRow;
    onEdit: () => void;
    onClone: () => void;
    onDeleted: () => void;
  }) {
    const [busy, setBusy] = React.useState(false);
    const doDelete = async () => {
      if (!confirm(`Delete role ${role.name}? This cannot be undone.`)) return;
      setBusy(true);
      const res = await deleteRoleAction(role.id);
      setBusy(false);
      if (!res.ok) {
        toast({ variant: "error", title: "Couldn't delete", description: res.error });
        return;
      }
      toast({ variant: "success", title: "Role deleted" });
      router.refresh();
    };
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button variant="ghost" size="icon-sm" aria-label="Actions" disabled={busy}>
            <IconDots size={16} />
          </Button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onSelect={onEdit}>
            <IconEdit size={14} /> Edit
          </DropdownItem>
          <DropdownItem onSelect={onClone}>
            <IconCopy size={14} /> Clone
          </DropdownItem>
          {!role.isSystem ? (
            <>
              <DropdownSeparator />
              <DropdownItem destructive onSelect={doDelete}>
                <IconTrash size={14} /> Delete
              </DropdownItem>
            </>
          ) : null}
        </DropdownContent>
      </Dropdown>
    );
  }
}

function CloneDialog({
  source,
  open,
  onOpenChange,
}: {
  source: RoleRow;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = React.useState(`${source.name} copy`);
  const [slug, setSlug] = React.useState(`${source.slug}-copy`);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setName(`${source.name} copy`);
    setSlug(`${source.slug}-copy`);
  }, [source]);

  const submit = async () => {
    setBusy(true);
    const res = await cloneRoleAction({ sourceRoleId: source.id, name, slug: slugify(slug) });
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't clone", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Role cloned" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Clone "${source.name}"`}
      description="The new role starts with the same permission set."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={submit} loading={busy}>
            Clone role
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Slug">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} spellCheck={false} />
        </Field>
      </div>
    </Modal>
  );
}
