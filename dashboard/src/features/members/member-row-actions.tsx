"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconDots,
  IconEdit,
  IconUserCheck,
  IconUserOff,
  IconUserX,
} from "@tabler/icons-react";
import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
  useToast,
} from "@/components/ui";
import {
  activateMemberAction,
  removeMemberAction,
  suspendMemberAction,
} from "@/actions/members";
import { EditMemberDialog } from "./edit-member-dialog";
import type {
  BranchOption,
  DepartmentOption,
  MemberRow,
  RoleOption,
  TeamOption,
} from "./types";

export function MemberRowActions({
  member,
  roles,
  branches,
  departments,
  teams,
  canEdit,
  canRemove,
}: {
  member: MemberRow;
  roles: RoleOption[];
  branches: BranchOption[];
  departments: DepartmentOption[];
  teams: TeamOption[];
  canEdit: boolean;
  canRemove: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Action failed", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Done" });
    router.refresh();
  };

  const isOwner = member.role.slug === "owner";
  const isSuspended = member.status === "SUSPENDED";
  const isArchived = member.status === "ARCHIVED";

  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <Button variant="ghost" size="icon-sm" aria-label="Actions" disabled={busy}>
            <IconDots size={16} />
          </Button>
        </DropdownTrigger>
        <DropdownContent>
          {canEdit ? (
            <DropdownItem onSelect={() => setEditOpen(true)} disabled={isArchived}>
              <IconEdit size={14} /> Edit member
            </DropdownItem>
          ) : null}
          {canEdit && !isOwner ? (
            isSuspended ? (
              <DropdownItem onSelect={() => run(() => activateMemberAction(member.id))}>
                <IconUserCheck size={14} /> Activate
              </DropdownItem>
            ) : (
              <DropdownItem onSelect={() => run(() => suspendMemberAction(member.id))} disabled={isArchived}>
                <IconUserOff size={14} /> Suspend
              </DropdownItem>
            )
          ) : null}
          {canRemove && !isOwner && !isArchived ? (
            <>
              <DropdownSeparator />
              <DropdownItem
                destructive
                onSelect={() => {
                  if (confirm(`Remove ${member.user.name}? They lose access immediately.`)) {
                    run(() => removeMemberAction(member.id));
                  }
                }}
              >
                <IconUserX size={14} /> Remove
              </DropdownItem>
            </>
          ) : null}
        </DropdownContent>
      </Dropdown>

      {canEdit ? (
        <EditMemberDialog
          member={member}
          roles={roles}
          branches={branches}
          departments={departments}
          teams={teams}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </>
  );
}
