"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import {
  IconDots,
  IconEdit,
  IconEye,
  IconRefresh,
  IconRotateClockwise,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { Invitation, Role } from "@prisma/client";
import {
  Badge,
  Button,
  DataTable,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  Modal,
  useToast,
} from "@/components/ui";
import {
  cancelInvitationAction,
  deleteInvitationAction,
  reopenInvitationAction,
  resendInvitationAction,
} from "@/actions/invitations";
import {
  InvitationEditDialog,
  type InvitationEditable,
} from "./invitation-edit-dialog";
import type {
  BranchOption,
  DepartmentOption,
  RoleOption,
  TeamOption,
} from "./types";

export type InvitationRow = Invitation & { role: Pick<Role, "id" | "name"> };

const STATUS_VARIANT: Record<InvitationRow["status"], "warning" | "success" | "neutral" | "danger"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  EXPIRED: "neutral",
  REVOKED: "danger",
  // DELETED rows are filtered out of the page query, but TS wants the
  // map exhaustive. If a DELETED row ever leaks through, render it as
  // a neutral tombstone rather than blowing up.
  DELETED: "neutral",
};
const STATUS_LABEL: Record<InvitationRow["status"], string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  EXPIRED: "Expired",
  REVOKED: "Cancelled",
  DELETED: "Deleted",
};

export function InvitationsTable({
  invitations,
  canManage,
  roles,
  branches,
  departments,
  teams,
}: {
  invitations: InvitationRow[];
  canManage: boolean;
  roles: RoleOption[];
  branches: BranchOption[];
  departments: DepartmentOption[];
  teams: TeamOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editTarget, setEditTarget] = React.useState<InvitationEditable | null>(null);
  const [viewTarget, setViewTarget] = React.useState<InvitationRow | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const act = async (id: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusyId(id);
    const res = await fn();
    setBusyId(null);
    if (!res.ok) {
      toast({ variant: "error", title: "Action failed", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Done" });
    router.refresh();
  };

  const columns = React.useMemo<ColumnDef<InvitationRow, unknown>[]>(
    () => [
      {
        id: "recipient",
        accessorFn: (r) => `${r.recipientName ?? ""} ${r.email}`,
        header: "Recipient",
        cell: ({ row }) => (
          <div className="flex flex-col leading-tight">
            <span className="font-medium text-[var(--color-foreground)]">
              {row.original.recipientName ?? row.original.email}
            </span>
            {row.original.recipientName ? (
              <span className="text-[11px] text-[var(--color-muted)]">{row.original.email}</span>
            ) : null}
          </div>
        ),
      },
      {
        id: "role",
        accessorFn: (r) => r.role.name,
        header: "Role",
        cell: ({ row }) => <Badge variant="dark">{row.original.role.name}</Badge>,
      },
      {
        id: "status",
        accessorFn: (r) => r.status,
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "expiresAt",
        accessorFn: (r) => r.expiresAt,
        header: "Expires",
        cell: ({ row }) => {
          const r = row.original;
          if (r.status !== "PENDING")
            return <span className="text-[var(--color-muted)] text-xs">—</span>;
          const expired = r.expiresAt.getTime() < Date.now();
          return (
            <span
              className={
                expired
                  ? "text-[var(--color-danger)] text-xs"
                  : "text-[var(--color-muted-foreground)] text-xs"
              }
            >
              {expired ? "Expired" : `in ${formatDistanceToNow(r.expiresAt)}`}
            </span>
          );
        },
      },
      {
        id: "createdAt",
        accessorFn: (r) => r.createdAt,
        header: "Sent",
        cell: ({ row }) => (
          <span className="text-[var(--color-muted-foreground)] text-xs">
            {formatDistanceToNow(row.original.createdAt, { addSuffix: true })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const inv = row.original;
          const busy = busyId === inv.id;
          return (
            <div className="flex justify-end">
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="ghost" size="icon-sm" aria-label="Actions" disabled={busy}>
                    <IconDots size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownContent>
                  {renderItems(inv)}
                </DropdownContent>
              </Dropdown>
            </div>
          );

          function renderItems(invitation: InvitationRow) {
            switch (invitation.status) {
              case "PENDING":
                return (
                  <>
                    <DropdownItem
                      disabled={!canManage}
                      onSelect={() =>
                        setEditTarget({
                          id: invitation.id,
                          recipientName: invitation.recipientName,
                          email: invitation.email,
                          roleId: invitation.roleId,
                          branchId: invitation.branchId,
                          departmentId: invitation.departmentId,
                          teamId: invitation.teamId,
                        })
                      }
                    >
                      <IconEdit size={14} /> Edit
                    </DropdownItem>
                    <DropdownItem
                      disabled={!canManage}
                      onSelect={() => act(invitation.id, () => resendInvitationAction(invitation.id))}
                    >
                      <IconRefresh size={14} /> Resend
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      destructive
                      disabled={!canManage}
                      onSelect={() => {
                        if (confirm(`Cancel invitation for ${invitation.email}?`)) {
                          act(invitation.id, () => cancelInvitationAction(invitation.id));
                        }
                      }}
                    >
                      <IconX size={14} /> Cancel
                    </DropdownItem>
                  </>
                );
              case "ACCEPTED":
                return (
                  <DropdownItem onSelect={() => setViewTarget(invitation)}>
                    <IconEye size={14} /> View details
                  </DropdownItem>
                );
              case "REVOKED":
                return (
                  <>
                    <DropdownItem
                      disabled={!canManage}
                      onSelect={() => act(invitation.id, () => reopenInvitationAction(invitation.id))}
                    >
                      <IconRotateClockwise size={14} /> Reopen
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      destructive
                      disabled={!canManage}
                      onSelect={() => {
                        if (confirm(`Delete invitation for ${invitation.email}?`)) {
                          act(invitation.id, () => deleteInvitationAction(invitation.id));
                        }
                      }}
                    >
                      <IconTrash size={14} /> Delete
                    </DropdownItem>
                  </>
                );
              case "DELETED":
                // Should never reach the UI; filtered in the page query.
                return null;
              case "EXPIRED":
                return (
                  <>
                    <DropdownItem
                      disabled={!canManage}
                      onSelect={() => act(invitation.id, () => reopenInvitationAction(invitation.id))}
                    >
                      <IconRefresh size={14} /> Reopen & resend
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      destructive
                      disabled={!canManage}
                      onSelect={() => {
                        if (confirm(`Delete invitation for ${invitation.email}?`)) {
                          act(invitation.id, () => deleteInvitationAction(invitation.id));
                        }
                      }}
                    >
                      <IconTrash size={14} /> Delete
                    </DropdownItem>
                  </>
                );
            }
          }
        },
      },
    ],
    [busyId, canManage]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={invitations}
        searchPlaceholder="Search invitations…"
        empty={{
          title: "No invitations",
          description: "Invitations you send will appear here.",
        }}
      />

      {editTarget ? (
        <InvitationEditDialog
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
          invitation={editTarget}
          roles={roles}
          branches={branches}
          departments={departments}
          teams={teams}
        />
      ) : null}

      {viewTarget ? (
        <Modal
          open={!!viewTarget}
          onOpenChange={(v) => !v && setViewTarget(null)}
          title="Invitation details"
          description={viewTarget.email}
          size="sm"
        >
          <dl className="grid grid-cols-3 gap-y-3 text-sm">
            <dt className="text-[var(--color-muted)]">Name</dt>
            <dd className="col-span-2">{viewTarget.recipientName ?? "—"}</dd>
            <dt className="text-[var(--color-muted)]">Role</dt>
            <dd className="col-span-2">{viewTarget.role.name}</dd>
            <dt className="text-[var(--color-muted)]">Status</dt>
            <dd className="col-span-2">{STATUS_LABEL[viewTarget.status]}</dd>
            <dt className="text-[var(--color-muted)]">Accepted</dt>
            <dd className="col-span-2">
              {viewTarget.acceptedAt
                ? formatDistanceToNow(viewTarget.acceptedAt, { addSuffix: true })
                : "—"}
            </dd>
          </dl>
        </Modal>
      ) : null}
    </>
  );
}
