import { z } from "zod";

/**
 * Lowercase slugify: strips diacritics, collapses non-alphanumerics to `-`,
 * trims leading/trailing dashes. Used as the *initial* slug suggestion —
 * the server still enforces uniqueness independently.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(64, "Workspace name is too long"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(48, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
