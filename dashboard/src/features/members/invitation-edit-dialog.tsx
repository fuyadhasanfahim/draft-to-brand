"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  useToast,
} from "@/components/ui";
import { updateInvitationAction } from "@/actions/invitations";
import type {
  BranchOption,
  DepartmentOption,
  RoleOption,
  TeamOption,
} from "./types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter the recipient's name").max(120),
  email: z.string().email("Enter a valid email").transform((v) => v.toLowerCase()),
  roleId: z.string().min(1, "Choose a role"),
  branchId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
});
type FormInput = z.infer<typeof schema>;

export type InvitationEditable = {
  id: string;
  recipientName: string | null;
  email: string;
  roleId: string;
  branchId: string | null;
  departmentId: string | null;
  teamId: string | null;
};

export function InvitationEditDialog({
  invitation,
  roles,
  branches,
  departments,
  teams,
  open,
  onOpenChange,
}: {
  invitation: InvitationEditable;
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
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: invitation.recipientName ?? "",
      email: invitation.email,
      roleId: invitation.roleId,
      branchId: invitation.branchId,
      departmentId: invitation.departmentId,
      teamId: invitation.teamId,
    },
  });

  React.useEffect(() => {
    reset({
      name: invitation.recipientName ?? "",
      email: invitation.email,
      roleId: invitation.roleId,
      branchId: invitation.branchId,
      departmentId: invitation.departmentId,
      teamId: invitation.teamId,
    });
  }, [invitation, reset]);

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

  const emailChanged = watch("email") !== invitation.email.toLowerCase();

  const onSubmit = async (values: FormInput) => {
    const res = await updateInvitationAction({ id: invitation.id, ...values });
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({
      variant: "success",
      title: "Invitation updated",
      description: emailChanged
        ? "Email changed — a new token was generated. Click Resend to deliver it."
        : "Changes saved.",
    });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit invitation"
      description="Changing the email rotates the token. The old link will stop working."
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="off" {...register("email")} />
          </Field>
        </div>
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
