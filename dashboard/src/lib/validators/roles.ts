import { z } from "zod";

const slug = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only");

const baseRoleFields = {
  name: z.string().trim().min(2, "Name is required").max(64),
  slug,
  description: z.string().trim().max(256).nullable().optional(),
  permissionKeys: z.array(z.string()),
};

export const createRoleSchema = z.object(baseRoleFields);
export const updateRoleSchema = z.object({ id: z.string().min(1), ...baseRoleFields });
export const cloneRoleSchema = z.object({
  sourceRoleId: z.string().min(1),
  name: z.string().trim().min(2).max(64),
  slug,
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CloneRoleInput = z.infer<typeof cloneRoleSchema>;
