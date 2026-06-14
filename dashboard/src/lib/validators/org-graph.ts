import { z } from "zod";

const slug = z
  .string()
  .min(2)
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only");

export const branchSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(64),
  slug,
  address: z.string().trim().max(200).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  country: z.string().trim().max(80).nullable().optional(),
  isHeadquarter: z.boolean().optional(),
});
export type BranchInput = z.infer<typeof branchSchema>;

export const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(64),
  slug,
  description: z.string().trim().max(256).nullable().optional(),
  branchId: z.string().nullable().optional(),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

export const teamSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(64),
  slug,
  description: z.string().trim().max(256).nullable().optional(),
  branchId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  teamLeadId: z.string().nullable().optional(),
});
export type TeamInput = z.infer<typeof teamSchema>;
