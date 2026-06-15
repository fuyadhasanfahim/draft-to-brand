import { z } from "zod";

const slug = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only");

const optionalString = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const optionalEmail = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine(
    (v) => !v || z.string().email().safeParse(v).success,
    "Enter a valid email"
  );

// Accepts ONLY `http://…` or `https://…`. `z.string().url()` accepts
// `javascript:` and other dangerous schemes per the WHATWG URL spec, so
// validating via Zod's built-in `url()` is not enough. We parse via
// `new URL` and enforce the protocol allowlist explicitly — matching the
// runtime guard in `src/lib/safe-url.ts`.
const optionalUrl = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine((v) => {
    if (!v) return true;
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must start with http:// or https://");

// ─── Company ─────────────────────────────────────────────────────────────

export const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(120),
  slug,
  website: optionalUrl,
  description: optionalString(500),
  status: z.enum(["ACTIVE", "PROSPECT", "ARCHIVED"]),
  // Reference-data FKs — validated cross-org in the action layer.
  industryId: z.string().nullable().optional(),
  countryId: z.string().nullable().optional(),
  companySizeId: z.string().nullable().optional(),
  leadSourceId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),         // Member id
  primaryContactId: z.string().nullable().optional(), // Contact id
  city: optionalString(80),
  address: optionalString(200),
  phone: optionalString(40),
  email: optionalEmail,
  tagIds: z.array(z.string()),
});
export type CompanyInput = z.infer<typeof companySchema>;

// ─── Contact ─────────────────────────────────────────────────────────────

export const contactSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: optionalEmail,
  phone: optionalString(40),
  jobTitle: optionalString(120),
  linkedinUrl: optionalUrl,
  notes: optionalString(500),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  companyId: z.string().nullable().optional(),
  tagIds: z.array(z.string()),
});
export type ContactInput = z.infer<typeof contactSchema>;

// ─── Tag ─────────────────────────────────────────────────────────────────

export const tagSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a hex color like #ff3131")
    .default("#6b6e6e"),
});
export type TagInput = z.infer<typeof tagSchema>;

// ─── Note ────────────────────────────────────────────────────────────────

export const noteSchema = z
  .object({
    id: z.string().optional(),
    companyId: z.string().nullable().optional(),
    contactId: z.string().nullable().optional(),
    content: z.string().trim().min(1, "Note can't be empty").max(4_000),
  })
  .refine((v) => Boolean(v.companyId) || Boolean(v.contactId) || Boolean(v.id), {
    message: "Note must attach to a company or contact",
    path: ["companyId"],
  });
export type NoteInput = z.infer<typeof noteSchema>;
