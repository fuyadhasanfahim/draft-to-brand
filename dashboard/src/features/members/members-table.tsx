"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Avatar, Badge, DataTable } from "@/components/ui";
import { MemberRowActions } from "./member-row-actions";
import type {
  BranchOption,
  DepartmentOption,
  MemberRow,
  RoleOption,
  TeamOption,
} from "./types";

const STATUS_LABEL: Record<MemberRow["status"], { label: string; variant: "success" | "warning" | "neutral" | "danger" }> = {
  ACTIVE:    { label: "Active",    variant: "success" },
  INVITED:   { label: "Invited",   variant: "warning" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
  ARCHIVED:  { label: "Removed",   variant: "neutral" },
};

export function MembersTable({
  members,
  roles,
  branches,
  departments,
  teams,
  canEdit,
  canRemove,
}: {
  members: MemberRow[];
  roles: RoleOption[];
  branches: BranchOption[];
  departments: DepartmentOption[];
  teams: TeamOption[];
  canEdit: boolean;
  canRemove: boolean;
}) {
  const columns = React.useMemo<ColumnDef<MemberRow, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (m) => m.user.name,
        header: "Name",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar name={m.user.name} src={m.user.image ?? undefined} size="sm" />
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-[var(--color-foreground)]">{m.user.name}</span>
                {m.jobTitle ? <span className="text-[11px] text-[var(--color-muted)]">{m.jobTitle}</span> : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "email",
        accessorFn: (m) => m.user.email,
        header: "Email",
        cell: ({ row }) => (
          <span className="text-[var(--color-muted-foreground)]">{row.original.user.email}</span>
        ),
      },
      {
        id: "role",
        accessorFn: (m) => m.role.name,
        header: "Role",
        cell: ({ row }) => <Badge variant="dark">{row.original.role.name}</Badge>,
      },
      {
        id: "team",
        accessorFn: (m) => m.team?.name ?? "—",
        header: "Team",
      },
      {
        id: "department",
        accessorFn: (m) => m.department?.name ?? "—",
        header: "Department",
      },
      {
        id: "branch",
        accessorFn: (m) => m.branch?.name ?? "—",
        header: "Branch",
      },
      {
        id: "status",
        accessorFn: (m) => m.status,
        header: "Status",
        cell: ({ row }) => {
          const s = STATUS_LABEL[row.original.status];
          return <Badge variant={s.variant}>{s.label}</Badge>;
        },
      },
      {
        id: "joinedAt",
        accessorFn: (m) => m.joinedAt,
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-[var(--color-muted-foreground)] text-[12px]">
            {format(row.original.joinedAt, "MMM d, yyyy")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canEdit || canRemove ? (
            <MemberRowActions
              member={row.original}
              roles={roles}
              branches={branches}
              departments={departments}
              teams={teams}
              canEdit={canEdit}
              canRemove={canRemove}
            />
          ) : null,
        enableSorting: false,
      },
    ],
    [roles, branches, departments, teams, canEdit, canRemove]
  );

  return (
    <DataTable
      columns={columns}
      data={members}
      searchPlaceholder="Search members…"
      empty={{
        title: "No members yet",
        description: "Invite your first teammate to get started.",
      }}
    />
  );
}
