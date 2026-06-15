"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconUserPlus } from "@tabler/icons-react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from "@/components/ui";
import { inviteMemberAction } from "@/actions/invitations";
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from "@/lib/validators/members";
import type {
  BranchOption,
  DepartmentOption,
  RoleOption,
  TeamOption,
} from "./types";

export function InviteMemberDialog({
  roles,
  branches,
  departments,
  teams,
}: {
  roles: RoleOption[];
  branches: BranchOption[];
  departments: DepartmentOption[];
  teams: TeamOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      roleId: "",
      branchId: null,
      departmentId: null,
      teamId: null,
    },
  });

  const selectedBranch = watch("branchId");
  const selectedDept = watch("departmentId");

  // Cascade: filter departments by branch, teams by branch + department.
  const filteredDepartments = selectedBranch
    ? departments.filter((d) => !d.branchId || d.branchId === selectedBranch)
    : departments;
  const filteredTeams = teams.filter((t) => {
    if (selectedBranch && t.branchId && t.branchId !== selectedBranch) return false;
    if (selectedDept && t.departmentId && t.departmentId !== selectedDept) return false;
    return true;
  });

  const onSubmit = async (values: InviteMemberInput) => {
    const res = await inviteMemberAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't send invitation", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Invitation sent", description: values.email });
    setOpen(false);
    reset();
    router.refresh();
  };

  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}>
        <IconUserPlus size={16} /> Invite member
      </Button>
      <Modal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
        title="Invite a member"
        description="They'll receive an email with a one-time invitation link."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
              Send invitation
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" required error={errors.name?.message}>
              <Input autoFocus {...register("name")} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
              <Input type="email" autoComplete="off" {...register("email")} />
            </Field>
          </div>
          <Field label="Role" required error={errors.roleId?.message}>
            <Select {...register("roleId")}>
              <option value="">Choose a role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Branch (optional)">
              <Select
                value={selectedBranch ?? ""}
                onChange={(e) => {
                  setValue("branchId", e.target.value || null);
                  setValue("departmentId", null);
                  setValue("teamId", null);
                }}
              >
                <option value="">—</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Department (optional)">
              <Select
                value={selectedDept ?? ""}
                onChange={(e) => {
                  setValue("departmentId", e.target.value || null);
                  setValue("teamId", null);
                }}
              >
                <option value="">—</option>
                {filteredDepartments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Team (optional)">
              <Select
                value={watch("teamId") ?? ""}
                onChange={(e) => setValue("teamId", e.target.value || null)}
              >
                <option value="">—</option>
                {filteredTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}
