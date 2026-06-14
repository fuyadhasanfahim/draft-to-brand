"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { IconRefresh, IconX } from "@tabler/icons-react";
import type { Invitation, Role } from "@prisma/client";
import {
  Badge,
  Button,
  DataTable,
  useToast,
} from "@/components/ui";
import { cancelInvitationAction, resendInvitationAction } from "@/actions/invitations";

export type InvitationRow = Invitation & { role: Pick<Role, "id" | "name"> };

const STATUS_VARIANT: Record<InvitationRow["status"], "warning" | "success" | "neutral" | "danger"> = {
  PENDING:  "warning",
  ACCEPTED: "success",
  EXPIRED:  "neutral",
  REVOKED:  "danger",
};

const STATUS_LABEL: Record<InvitationRow["status"], string> = {
  PENDING:  "Pending",
  ACCEPTED: "Accepted",
  EXPIRED:  "Expired",
  REVOKED:  "Cancelled",
};

export function InvitationsTable({
  invitations,
  canManage,
}: {
  invitations: InvitationRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
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
      { id: "email", accessorFn: (r) => r.email, header: "Email" },
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
          if (r.status !== "PENDING") return <span className="text-[var(--color-muted)] text-xs">—</span>;
          const expired = r.expiresAt.getTime() < Date.now();
          return (
            <span className={expired ? "text-[var(--color-danger)] text-xs" : "text-[var(--color-muted-foreground)] text-xs"}>
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
          if (!canManage || inv.status !== "PENDING") return null;
          const busy = busyId === inv.id;
          return (
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => act(inv.id, () => resendInvitationAction(inv.id))}
                loading={busy}
              >
                <IconRefresh size={13} /> Resend
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Cancel invitation for ${inv.email}?`)) {
                    act(inv.id, () => cancelInvitationAction(inv.id));
                  }
                }}
                disabled={busy}
              >
                <IconX size={13} /> Cancel
              </Button>
            </div>
          );
        },
      },
    ],
    [busyId, canManage]
  );

  return (
    <DataTable
      columns={columns}
      data={invitations}
      empty={{ title: "No invitations", description: "Invitations you send will appear here." }}
    />
  );
}
