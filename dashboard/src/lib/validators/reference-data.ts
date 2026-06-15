import { z } from "zod";

const slug = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only");

const optionalString = (max: number) =>
  z.string().trim().max(max).nullable().optional();

void optionalString;

export const industrySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(80),
  slug,
  isActive: z.boolean().optional(),
});
export type IndustryInput = z.infer<typeof industrySchema>;

export const companySizeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(60),
  slug,
  sortOrder: z.number().int().min(0).max(1_000).optional(),
  isActive: z.boolean().optional(),
});
export type CompanySizeInput = z.infer<typeof companySizeSchema>;

export const leadSourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(60),
  slug,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a hex color like #ff3131")
    .optional(),
  isActive: z.boolean().optional(),
});
export type LeadSourceInput = z.infer<typeof leadSourceSchema>;
