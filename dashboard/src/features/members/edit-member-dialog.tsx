"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from "@/components/ui";
import { updateMemberAction } from "@/actions/members";
import {
  updateMemberSchema,
  type UpdateMemberInput,
} from "@/lib/validators/members";
import type {
  BranchOption,
  DepartmentOption,
  MemberRow,
  RoleOption,
  TeamOption,
} from "./types";

export function EditMemberDialog({
  member,
  roles,
  branches,
  departments,
  teams,
  open,
  onOpenChange,
}: {
  member: MemberRow;
  roles: RoleOption[];
  branches: BranchOption[];
  departments: DepartmentOption[];
  teams: TeamOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMemberInput>({
    resolver: zodResolver(updateMemberSchema),
    defaultValues: {
      memberId: member.id,
      roleId: member.roleId,
      branchId: member.branchId,
      departmentId: member.departmentId,
      teamId: member.teamId,
      jobTitle: member.jobTitle,
    },
  });

  const selectedBranch = watch("branchId");
  const selectedDept = watch("departmentId");

  const filteredDepartments = selectedBranch
    ? departments.filter((d) => !d.branchId || d.branchId === selectedBranch)
    : departments;
  const filteredTeams = teams.filter((t) => {
    if (selectedBranch && t.branchId && t.branchId !== selectedBranch) return false;
    if (selectedDept && t.departmentId && t.departmentId !== selectedDept) return false;
    return true;
  });

  const onSubmit = async (values: UpdateMemberInput) => {
    const res = await updateMemberAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't update", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Member updated" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${member.user.name}`}
      description={member.user.email}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("memberId")} />
        <Field label="Job title">
          <Input {...register("jobTitle")} placeholder="e.g. Senior Strategist" />
        </Field>
        <Field label="Role" error={errors.roleId?.message}>
          <Select {...register("roleId")}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Branch">
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
          <Field label="Department">
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
          <Field label="Team">
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
  );
}
