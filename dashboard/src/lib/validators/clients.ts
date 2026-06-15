import { z } from "zod";

const optionalString = (max: number) =>
  z.string().trim().max(max).nullable().optional();

/**
 * Edit + manual-create payload. Company is required (a Client always points
 * at a Company); leadId stays optional and is only set by the conversion
 * action — never accepted from the edit form.
 */
export const clientSchema = z.object({
  id: z.string().optional(),
  companyId: z.string().min(1, "Company is required"),
  ownerId: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  onboardingStatus: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
  startDate: z
    .union([z.string(), z.date()])
    .nullable()
    .default(null)
    .transform((v) => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }),
  notes: optionalString(4_000),
});
export type ClientInput = z.output<typeof clientSchema>;
export type ClientFormValues = z.input<typeof clientSchema>;

/** Conversion payload — just the lead id; the action derives everything else. */
export const convertLeadToClientSchema = z.object({
  leadId: z.string().min(1, "Lead id is required"),
});
export type ConvertLeadToClientInput = z.infer<typeof convertLeadToClientSchema>;
