import { z } from "zod";

const slug = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only");

const optionalString = (max: number) =>
  z.string().trim().max(max).nullable().optional();

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Pick a hex color like #ff3131");

export const CURRENCY_VALUES = [
  "USD", "EUR", "GBP", "AUD", "CAD", "SGD", "AED", "BDT",
] as const;
export type CurrencyCode = (typeof CURRENCY_VALUES)[number];

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
  SGD: "Singapore Dollar",
  AED: "UAE Dirham",
  BDT: "Bangladeshi Taka",
};

// ─── Pipeline ────────────────────────────────────────────────────────────

export const pipelineSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(80),
  slug,
  description: optionalString(500),
  isDefault: z.boolean().optional(),
});
export type PipelineInput = z.infer<typeof pipelineSchema>;

// ─── PipelineStage ───────────────────────────────────────────────────────

export const pipelineStageSchema = z.object({
  id: z.string().optional(),
  pipelineId: z.string().min(1, "Pipeline is required"),
  name: z.string().trim().min(1, "Name is required").max(60),
  slug,
  color: hexColor.optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  winProbability: z.number().int().min(0).max(100).optional(),
  outcome: z.enum(["OPEN", "WON", "LOST"]).optional(),
});
export type PipelineStageInput = z.infer<typeof pipelineStageSchema>;

export const reorderStagesSchema = z.object({
  pipelineId: z.string().min(1),
  stageIds: z.array(z.string()).min(1),
});
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;

// ─── Lead ────────────────────────────────────────────────────────────────

/**
 * Lead "quick edit" — the slim form used by the inline modal on existing
 * leads. Owner + status are server-derived (owner = current member on
 * create; status = stage outcome on every write), so neither appears here.
 */
export const leadSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2, "Title is required").max(160),
  companyId: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  leadSourceId: z.string().nullable().optional(),
  pipelineId: z.string().min(1, "Pipeline is required"),
  stageId: z.string().min(1, "Stage is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  estimatedValue: z
    .number()
    .min(0)
    .max(1_000_000_000_000)
    .nullable()
    .optional(),
  currency: z.enum(CURRENCY_VALUES).nullable().optional(),
  expectedCloseDate: z
    .union([z.string(), z.date()])
    .nullable()
    .default(null)
    .transform((v) => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }),
  description: optionalString(2_000),
});
export type LeadInput = z.output<typeof leadSchema>;
export type LeadFormValues = z.input<typeof leadSchema>;

/**
 * "Create lead from scratch" — the full /dashboard/leads/new payload that
 * carries a Lead, its Company, the Primary Contact, and any additional
 * contacts. Executed as a single transaction server-side.
 */
// Primary-contact fields. All optional at the schema level because the form
// can either reuse an existing contact (existingPrimaryContactId set) OR
// create one. `superRefine` below enforces the either-or rule.
const primaryContactInputSchema = z.object({
  firstName: z.string().trim().max(80).optional(),
  lastName:  z.string().trim().max(80).optional(),
  email:     z.string().trim().optional(),
  phone:     optionalString(40),
  jobTitle:  optionalString(120),
  linkedinUrl: z
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
    }, "URL must start with http:// or https://"),
});

// Additional contacts always need a name; email is optional. (Unlike the
// primary contact, you can't "pick existing" for these — they're free-form.)
const additionalContactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName:  z.string().trim().min(1, "Last name is required").max(80),
  email: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Enter a valid email"
    ),
  phone:    optionalString(40),
  jobTitle: optionalString(120),
  linkedinUrl: z
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
    }, "URL must start with http:// or https://"),
});

export const newLeadFromScratchSchema = z
  .object({
    // Lead
    title: z.string().trim().min(2, "Title is required").max(160),
    pipelineId: z.string().min(1, "Pipeline is required"),
    stageId: z.string().min(1, "Stage is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),

    // Company — either reuse an existing one OR fill the company block.
    // The form sets companyId when the user picks from the search combobox.
    companyId: z.string().nullable().optional(),
    company: z.object({
      name: z.string().trim().max(120).optional(),
      website: z
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
        }, "URL must start with http:// or https://"),
      industryId:    z.string().nullable().optional(),
      countryId:     z.string().nullable().optional(),
      companySizeId: z.string().nullable().optional(),
      leadSourceId:  z.string().nullable().optional(),
    }),

    // Primary contact — either reuse an existing contact at the chosen
    // company OR fill the contact block.
    existingPrimaryContactId: z.string().nullable().optional(),
    primaryContact: primaryContactInputSchema,
    additionalContacts: z.array(additionalContactSchema).max(20).default([]),

    // Opportunity
    expectedCloseDate: z
      .union([z.string(), z.date()])
      .nullable()
      .default(null)
      .transform((v) => {
        if (!v) return null;
        const d = v instanceof Date ? v : new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      }),
    estimatedValue: z.number().min(0).max(1_000_000_000_000).nullable().optional(),
    currency: z.enum(CURRENCY_VALUES).nullable().optional(),
    description: optionalString(2_000),
  })
  .superRefine((data, ctx) => {
    // Company: require either an existing id OR a fillable name.
    if (!data.companyId) {
      const n = data.company?.name?.trim() ?? "";
      if (n.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["company", "name"],
          message: "Company name is required",
        });
      }
    }

    // Primary contact: same shape. If picking existing, skip individual
    // field checks; otherwise require first/last/email.
    if (!data.existingPrimaryContactId) {
      const pc = data.primaryContact;
      if (!pc?.firstName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["primaryContact", "firstName"],
          message: "First name is required",
        });
      }
      if (!pc?.lastName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["primaryContact", "lastName"],
          message: "Last name is required",
        });
      }
      const email = pc?.email?.trim() ?? "";
      if (!email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["primaryContact", "email"],
          message: "Email is required",
        });
      } else if (!z.string().email().safeParse(email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["primaryContact", "email"],
          message: "Enter a valid email",
        });
      }
    }
  });

export type NewLeadInput = z.output<typeof newLeadFromScratchSchema>;
export type NewLeadFormValues = z.input<typeof newLeadFromScratchSchema>;

// Reassignment / primary-contact change (Lead detail).
export const reassignLeadOwnerSchema = z.object({
  leadId: z.string().min(1),
  ownerId: z.string().nullable(),
});
export type ReassignLeadOwnerInput = z.infer<typeof reassignLeadOwnerSchema>;

export const setPrimaryContactSchema = z.object({
  companyId: z.string().min(1),
  contactId: z.string().nullable(),
});
export type SetPrimaryContactInput = z.infer<typeof setPrimaryContactSchema>;
