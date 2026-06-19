import { z } from "zod";

/**
 * Followup sequence validators (Phase 3). Shared client + server; the server
 * always re-parses.
 */

export const STEP_CONDITIONS = [
  "ALWAYS",
  "NOT_OPENED",
  "OPENED_NOT_CLICKED",
  "CLICKED_NOT_REPLIED",
] as const;

/** Create + edit a sequence's identity. */
export const sequenceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Sequence name is required").max(160),
  description: z.string().trim().max(2_000).optional().nullable(),
});
export type SequenceInput = z.output<typeof sequenceSchema>;
export type SequenceFormValues = z.input<typeof sequenceSchema>;

/** Activate / pause a sequence. */
export const sequenceActiveSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean(),
});
export type SequenceActiveInput = z.infer<typeof sequenceActiveSchema>;

/** Create + edit a step. `stepNumber` is assigned server-side on create. */
export const sequenceStepSchema = z.object({
  id: z.string().optional(),
  sequenceId: z.string().min(1, "Sequence id is required"),
  delayDays: z
    .number({ message: "Delay must be a number" })
    .int("Delay must be a whole number")
    .min(0, "Delay can't be negative")
    .max(365, "Delay can't exceed 365 days"),
  subject: z.string().trim().min(1, "Subject is required").max(255),
  body: z.string().trim().min(1, "Email body is required").max(20_000),
  condition: z.enum(STEP_CONDITIONS),
});
export type SequenceStepInput = z.output<typeof sequenceStepSchema>;
export type SequenceStepFormValues = z.input<typeof sequenceStepSchema>;

export const deleteStepSchema = z.object({
  stepId: z.string().min(1, "Step id is required"),
});
export type DeleteStepInput = z.infer<typeof deleteStepSchema>;

/** Attach (or detach with null) a sequence to a campaign. */
export const attachSequenceSchema = z.object({
  campaignId: z.string().min(1, "Campaign id is required"),
  sequenceId: z.string().min(1).nullable(),
});
export type AttachSequenceInput = z.infer<typeof attachSequenceSchema>;
