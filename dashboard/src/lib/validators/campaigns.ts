import { z } from "zod";

/**
 * Cold Email campaign validators (Phase 3A — foundation only).
 *
 * Shared client + server. The server always re-parses; client validation is a
 * convenience. `status` is never accepted on the content form (campaigns are
 * born DRAFT and transition via `setCampaignStatusAction`).
 */

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
] as const;

/** Create + edit the campaign's content. */
export const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Campaign name is required").max(160),
  subject: z.string().trim().min(1, "Subject is required").max(255),
  body: z.string().trim().min(1, "Email body is required").max(20_000),
  // Sender identity (Phase 2A). Both optional — blank falls back to brand
  // defaults. `replyTo` accepts a valid email or an empty string (cleared).
  fromName: z.string().trim().max(120).optional().nullable(),
  replyTo: z
    .union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email").max(255)])
    .optional()
    .nullable(),
});
export type CampaignInput = z.output<typeof campaignSchema>;
export type CampaignFormValues = z.input<typeof campaignSchema>;

/** Send (dispatch) a campaign to its PENDING recipients. */
export const sendCampaignSchema = z.object({
  campaignId: z.string().min(1, "Campaign id is required"),
});
export type SendCampaignInput = z.infer<typeof sendCampaignSchema>;

/** Campaign lifecycle transition (Start / Pause / Resume / Complete). */
export const campaignStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(CAMPAIGN_STATUSES),
});
export type CampaignStatusInput = z.infer<typeof campaignStatusSchema>;

/**
 * Add recipients to a campaign by selecting existing Contacts and/or Leads.
 * The action resolves each id to an email/name server-side (never trusts the
 * client for the address) and de-duplicates against existing recipients.
 */
export const addRecipientsSchema = z
  .object({
    campaignId: z.string().min(1, "Campaign id is required"),
    contactIds: z.array(z.string().min(1)).default([]),
    leadIds: z.array(z.string().min(1)).default([]),
  })
  .refine((v) => v.contactIds.length > 0 || v.leadIds.length > 0, {
    message: "Select at least one contact or lead.",
    path: ["contactIds"],
  });
export type AddRecipientsInput = z.infer<typeof addRecipientsSchema>;

export const removeRecipientSchema = z.object({
  recipientId: z.string().min(1, "Recipient id is required"),
});
export type RemoveRecipientInput = z.infer<typeof removeRecipientSchema>;
