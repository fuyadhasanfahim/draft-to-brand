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

/**
 * Members table — designed for scanability.
 *
 *   - One "Member" column carries identity + email (+ jobTitle below name).
 *     A separate Email column was redundant noise.
 *   - Role / Team / Status / Joined stay visible at all widths.
 *   - Department and Branch are deprioritized to `hidden md:table-cell`
 *     so narrow viewports stay readable; they're visible on tablets/desktop.
 *   - The actions column is fixed-width on the right.
 */
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
        id: "member",
        accessorFn: (m) => `${m.user.name} ${m.user.email}`,
        header: "Member",
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center gap-3 min-w-[220px]">
              <Avatar name={m.user.name} src={m.user.image ?? undefined} size="sm" />
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-medium text-[var(--color-foreground)] truncate">
                  {m.user.name}
                </span>
                <span className="text-[11px] text-[var(--color-muted)] truncate">
                  {m.user.email}
                  {m.jobTitle ? ` · ${m.jobTitle}` : ""}
                </span>
              </div>
            </div>
          );
        },
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
        meta: { className: "hidden md:table-cell" },
      },
      {
        id: "branch",
        accessorFn: (m) => m.branch?.name ?? "—",
        header: "Branch",
        meta: { className: "hidden lg:table-cell" },
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
          <span className="text-[var(--color-muted-foreground)] text-[12px] whitespace-nowrap">
            {format(row.original.joinedAt, "MMM d, yyyy")}
          </span>
        ),
        meta: { className: "hidden sm:table-cell" },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canEdit || canRemove ? (
            <div className="flex justify-end">
              <MemberRowActions
                member={row.original}
                roles={roles}
                branches={branches}
                departments={departments}
                teams={teams}
                canEdit={canEdit}
                canRemove={canRemove}
              />
            </div>
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
