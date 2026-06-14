import { z } from "zod";

export const updateMemberSchema = z.object({
  memberId: z.string().min(1),
  roleId: z.string().min(1, "Role is required"),
  branchId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  jobTitle: z.string().max(120).nullable().optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const inviteMemberSchema = z.object({
  name: z.string().min(2, "Enter the recipient's name").max(120),
  email: z.string().email("Enter a valid email").transform((v) => v.toLowerCase()),
  roleId: z.string().min(1, "Choose a role"),
  branchId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
