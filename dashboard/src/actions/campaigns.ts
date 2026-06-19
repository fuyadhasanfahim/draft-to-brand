"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireVerifiedSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send-email";
import { buildFrom } from "@/lib/email/from";
import { enrollSentRecipients } from "@/lib/email/sequence-runner";
import { suppressedEmailSet } from "@/lib/email/suppression";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import CampaignEmail from "@/emails/templates/campaign-email";
import {
  campaignSchema,
  campaignStatusSchema,
  addRecipientsSchema,
  removeRecipientSchema,
  sendCampaignSchema,
  type CampaignFormValues,
  type CampaignStatusInput,
  type AddRecipientsInput,
  type RemoveRecipientInput,
  type SendCampaignInput,
} from "@/lib/validators/campaigns";

type Result = { ok: true; id?: string } | { ok: false; error: string };
type SendResult =
  | { ok: true; sent: number; failed: number; suppressed: number }
  | { ok: false; error: string };

/** Trim a sender field to null when empty so blank inputs fall back to brand defaults. */
function blankToNull(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

/**
 * Load an org-owned campaign or return null. Centralizes the cross-org guard
 * every campaign mutation needs (defense against acting on another tenant's
 * campaign id).
 */
async function findOrgCampaign(id: string, organizationId: string) {
  return prisma.emailCampaign.findFirst({ where: { id, organizationId } });
}

export async function createCampaignAction(
  input: CampaignFormValues
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.create")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  try {
    const created = await prisma.emailCampaign.create({
      data: {
        organizationId: orgId,
        name: parsed.data.name,
        subject: parsed.data.subject,
        body: parsed.data.body,
        fromName: blankToNull(parsed.data.fromName),
        replyTo: blankToNull(parsed.data.replyTo),
        status: "DRAFT",
        createdById: session.user.id,
      },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "campaign.created",
      resource: "campaign",
      resourceId: created.id,
      metadata: { name: created.name },
    });
    revalidatePath("/dashboard/campaigns");
    return { ok: true, id: created.id };
  } catch (err) {
    console.error("[campaigns] create failed", err);
    return { ok: false, error: "Could not create campaign." };
  }
}

export async function updateCampaignAction(
  input: CampaignFormValues
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.edit")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = campaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (!parsed.data.id) return { ok: false, error: "Campaign id is required." };
  const orgId = session.member.organizationId;

  const existing = await findOrgCampaign(parsed.data.id, orgId);
  if (!existing) return { ok: false, error: "Campaign not found." };

  try {
    const updated = await prisma.emailCampaign.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        subject: parsed.data.subject,
        body: parsed.data.body,
        fromName: blankToNull(parsed.data.fromName),
        replyTo: blankToNull(parsed.data.replyTo),
      },
    });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "campaign.updated",
      resource: "campaign",
      resourceId: updated.id,
      metadata: { name: updated.name },
    });
    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${updated.id}`);
    return { ok: true, id: updated.id };
  } catch (err) {
    console.error("[campaigns] update failed", err);
    return { ok: false, error: "Could not update campaign." };
  }
}

/**
 * Transition a campaign's lifecycle status (Start / Pause / Resume / Complete).
 * Foundation only — flipping to RUNNING does NOT send anything; it just records
 * intent. A future sending phase will hang real work off this transition.
 */
export async function setCampaignStatusAction(
  input: CampaignStatusInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.edit")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = campaignStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const existing = await findOrgCampaign(parsed.data.id, orgId);
  if (!existing) return { ok: false, error: "Campaign not found." };

  if (existing.status === parsed.data.status) return { ok: true, id: existing.id };

  await prisma.emailCampaign.update({
    where: { id: existing.id },
    data: { status: parsed.data.status },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "campaign.updated",
    resource: "campaign",
    resourceId: existing.id,
    metadata: { fromStatus: existing.status, toStatus: parsed.data.status },
  });
  revalidatePath("/dashboard/campaigns");
  revalidatePath(`/dashboard/campaigns/${existing.id}`);
  return { ok: true, id: existing.id };
}

/**
 * Soft-delete (archive) / restore a campaign. Mirrors the codebase-wide
 * archive-vs-hard-delete convention (`archivedAt` toggle, like Clients/Leads).
 */
export async function archiveCampaignAction(id: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.delete")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const orgId = session.member.organizationId;

  const existing = await findOrgCampaign(id, orgId);
  if (!existing) return { ok: false, error: "Campaign not found." };

  const archiving = !existing.archivedAt;
  await prisma.emailCampaign.update({
    where: { id },
    data: { archivedAt: archiving ? new Date() : null },
  });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: archiving ? "campaign.deleted" : "campaign.restored",
    resource: "campaign",
    resourceId: id,
  });
  revalidatePath("/dashboard/campaigns");
  revalidatePath(`/dashboard/campaigns/${id}`);
  return { ok: true };
}

/**
 * Add recipients to a campaign from existing Contacts and/or Leads.
 *  - Cross-org validated: every contact/lead id must belong to the workspace.
 *  - Email/name are resolved server-side and denormalized onto EmailRecipient.
 *  - De-duplicated against recipients already on the campaign (by source id).
 */
export async function addRecipientsAction(
  input: AddRecipientsInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.edit")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = addRecipientsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const campaign = await findOrgCampaign(parsed.data.campaignId, orgId);
  if (!campaign) return { ok: false, error: "Campaign not found." };

  // Resolve sources within the org (cross-tenant guard).
  const [contacts, leads, existingRecipients] = await Promise.all([
    parsed.data.contactIds.length
      ? prisma.contact.findMany({
          where: { id: { in: parsed.data.contactIds }, organizationId: orgId },
          select: { id: true, email: true, firstName: true, lastName: true, companyId: true },
        })
      : Promise.resolve([]),
    parsed.data.leadIds.length
      ? prisma.lead.findMany({
          where: { id: { in: parsed.data.leadIds }, organizationId: orgId },
          select: {
            id: true,
            contactId: true,
            companyId: true,
            contact: { select: { email: true, firstName: true, lastName: true } },
          },
        })
      : Promise.resolve([]),
    prisma.emailRecipient.findMany({
      where: { campaignId: campaign.id },
      select: { contactId: true, leadId: true },
    }),
  ]);

  const usedContactIds = new Set(
    existingRecipients.map((r) => r.contactId).filter(Boolean) as string[]
  );
  const usedLeadIds = new Set(
    existingRecipients.map((r) => r.leadId).filter(Boolean) as string[]
  );

  const rows: Prisma.EmailRecipientCreateManyInput[] = [];

  for (const c of contacts) {
    if (usedContactIds.has(c.id)) continue;
    rows.push({
      campaignId: campaign.id,
      contactId: c.id,
      // Resolved server-side (Contact → Company) for per-company reporting.
      companyId: c.companyId ?? null,
      email: c.email ?? "",
      firstName: c.firstName ?? null,
      lastName: c.lastName ?? null,
    });
  }
  for (const l of leads) {
    if (usedLeadIds.has(l.id)) continue;
    rows.push({
      campaignId: campaign.id,
      leadId: l.id,
      // Keep the contact provenance too when the lead has a linked contact.
      contactId: l.contactId ?? null,
      // Resolved server-side (Lead → Company) for per-company reporting.
      companyId: l.companyId ?? null,
      email: l.contact?.email ?? "",
      firstName: l.contact?.firstName ?? null,
      lastName: l.contact?.lastName ?? null,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "Those recipients are already on the campaign." };
  }

  try {
    await prisma.emailRecipient.createMany({ data: rows });
    await logAudit({
      organizationId: orgId,
      actorUserId: session.user.id,
      action: "recipient.added",
      resource: "campaign",
      resourceId: campaign.id,
      metadata: {
        count: rows.length,
        contacts: contacts.length,
        leads: leads.length,
      },
    });
    revalidatePath(`/dashboard/campaigns/${campaign.id}`);
    revalidatePath("/dashboard/campaigns");
    return { ok: true, id: campaign.id };
  } catch (err) {
    console.error("[campaigns] addRecipients failed", err);
    return { ok: false, error: "Could not add recipients." };
  }
}

/**
 * Refresh recipient snapshots from their source Contact/Lead — **DRAFT only**.
 *
 * EmailRecipient denormalizes email/name/companyId at add time (immutable
 * history). For an unsent draft, a later Contact/Lead edit leaves the recipient
 * stale; this re-resolves email/firstName/lastName/companyId from the live
 * source. Recipients with no source (manual) and recipients whose source was
 * deleted (FK already SetNull) are skipped. RUNNING/PAUSED/COMPLETED campaigns
 * are rejected — sent history stays immutable.
 */
export async function refreshRecipientsAction(campaignId: string): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.edit")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const orgId = session.member.organizationId;

  const campaign = await findOrgCampaign(campaignId, orgId);
  if (!campaign) return { ok: false, error: "Campaign not found." };
  if (campaign.status !== "DRAFT") {
    return { ok: false, error: "Only draft campaigns can be refreshed." };
  }

  // Only recipients that still have a source can be refreshed.
  const recipients = await prisma.emailRecipient.findMany({
    where: {
      campaignId: campaign.id,
      OR: [{ contactId: { not: null } }, { leadId: { not: null } }],
    },
    select: {
      id: true,
      contactId: true,
      leadId: true,
      email: true,
      firstName: true,
      lastName: true,
      companyId: true,
    },
  });
  if (recipients.length === 0) return { ok: true, id: campaign.id };

  const contactIds = recipients.filter((r) => !r.leadId && r.contactId).map((r) => r.contactId!);
  const leadIds = recipients.filter((r) => r.leadId).map((r) => r.leadId!);

  const [contacts, leads] = await Promise.all([
    contactIds.length
      ? prisma.contact.findMany({
          where: { id: { in: contactIds }, organizationId: orgId },
          select: { id: true, email: true, firstName: true, lastName: true, companyId: true },
        })
      : Promise.resolve([]),
    leadIds.length
      ? prisma.lead.findMany({
          where: { id: { in: leadIds }, organizationId: orgId },
          select: {
            id: true,
            contactId: true,
            companyId: true,
            contact: { select: { email: true, firstName: true, lastName: true } },
          },
        })
      : Promise.resolve([]),
  ]);
  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const leadById = new Map(leads.map((l) => [l.id, l]));

  const updates: Prisma.PrismaPromise<unknown>[] = [];
  for (const r of recipients) {
    let next: { email: string; firstName: string | null; lastName: string | null; companyId: string | null; contactId: string | null } | null = null;

    if (r.leadId) {
      const l = leadById.get(r.leadId);
      if (l) {
        next = {
          email: l.contact?.email ?? "",
          firstName: l.contact?.firstName ?? null,
          lastName: l.contact?.lastName ?? null,
          companyId: l.companyId ?? null,
          contactId: l.contactId ?? null,
        };
      }
    } else if (r.contactId) {
      const c = contactById.get(r.contactId);
      if (c) {
        next = {
          email: c.email ?? "",
          firstName: c.firstName ?? null,
          lastName: c.lastName ?? null,
          companyId: c.companyId ?? null,
          contactId: c.id,
        };
      }
    }
    if (!next) continue;

    const changed =
      next.email !== r.email ||
      next.firstName !== r.firstName ||
      next.lastName !== r.lastName ||
      next.companyId !== r.companyId;
    if (!changed) continue;

    updates.push(
      prisma.emailRecipient.update({ where: { id: r.id }, data: next })
    );
  }

  if (updates.length === 0) return { ok: true, id: campaign.id };

  await prisma.$transaction(updates);
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "campaign.updated",
    resource: "campaign",
    resourceId: campaign.id,
    metadata: { change: "recipients_refreshed", count: updates.length },
  });
  revalidatePath(`/dashboard/campaigns/${campaign.id}`);
  return { ok: true, id: campaign.id };
}

/**
 * Remove a single recipient from a campaign. Cascade drops its events. The
 * recipient is located through its campaign so the org guard still applies.
 */
export async function removeRecipientAction(
  input: RemoveRecipientInput
): Promise<Result> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.edit")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = removeRecipientSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const recipient = await prisma.emailRecipient.findFirst({
    where: { id: parsed.data.recipientId, campaign: { organizationId: orgId } },
    select: { id: true, campaignId: true },
  });
  if (!recipient) return { ok: false, error: "Recipient not found." };

  await prisma.emailRecipient.delete({ where: { id: recipient.id } });
  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "recipient.removed",
    resource: "campaign",
    resourceId: recipient.campaignId,
    metadata: { recipientId: recipient.id },
  });
  revalidatePath(`/dashboard/campaigns/${recipient.campaignId}`);
  revalidatePath("/dashboard/campaigns");
  return { ok: true };
}

/**
 * Send a DRAFT campaign to its PENDING recipients (Phase 2A — real sending).
 *
 * Workflow: Campaign → PENDING recipients → send via Resend → mark SENT +
 * stamp `sentAt` → write a `SENT` EmailEvent → transition campaign to RUNNING.
 *
 * Rules & safety:
 *  - Only DRAFT campaigns can be sent (the UI only shows the button then).
 *  - Only PENDING recipients are sent — SENT/OPENED/CLICKED/REPLIED/BOUNCED are
 *    never re-sent (no resend in this phase).
 *  - Per-recipient failures are isolated: a failed send does NOT mark SENT and
 *    does NOT create a SENT event; the loop continues to the next recipient.
 *  - Reuses the existing email stack (`sendEmail` → Resend, `EMAIL_CONFIG`).
 *  - Performance: recipients are read once (no N+1), sends run per-recipient,
 *    and all status updates + events are written in a single batched
 *    transaction afterwards (`updateMany` + `createMany`). Queues are
 *    intentionally out of scope for this MVP.
 */
export async function sendCampaignAction(
  input: SendCampaignInput
): Promise<SendResult> {
  const session = await requireVerifiedSession();
  if (!(await can("campaigns.edit")) && !(await can("campaigns.manage"))) {
    return { ok: false, error: "No permission." };
  }
  const parsed = sendCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const orgId = session.member.organizationId;

  const campaign = await findOrgCampaign(parsed.data.campaignId, orgId);
  if (!campaign) return { ok: false, error: "Campaign not found." };
  if (campaign.archivedAt) {
    return { ok: false, error: "Restore the campaign before sending." };
  }
  if (campaign.status !== "DRAFT") {
    return { ok: false, error: "Only draft campaigns can be sent." };
  }

  // Read recipients once — only PENDING are eligible.
  const recipients = await prisma.emailRecipient.findMany({
    where: { campaignId: campaign.id, status: "PENDING" },
    select: { id: true, email: true, firstName: true },
  });
  if (recipients.length === 0) {
    return { ok: false, error: "No pending recipients to send." };
  }

  // Production safety — never send to a suppressed (unsubscribed / bounced /
  // complained) address. One query, no N+1.
  const suppressedSet = await suppressedEmailSet(
    orgId,
    recipients.map((r) => r.email).filter(Boolean)
  );

  const from = buildFrom(campaign.fromName);
  const replyTo = campaign.replyTo ?? undefined;

  // Accumulate results; persist in one batched transaction after sending so we
  // don't issue a query per recipient.
  const sentRecipientIds: string[] = [];
  const events: Prisma.EmailEventCreateManyInput[] = [];
  let failed = 0;
  let suppressed = 0;

  for (const r of recipients) {
    // No address → can't deliver. Treat as a failure (don't mark SENT).
    if (!r.email) {
      failed += 1;
      continue;
    }
    // Suppressed → skip (leave PENDING, don't mark SENT).
    if (suppressedSet.has(r.email.trim().toLowerCase())) {
      suppressed += 1;
      continue;
    }
    const unsub = unsubscribeUrl(r.id);
    const res = await sendEmail({
      to: r.email,
      subject: campaign.subject,
      // recipientId activates open-pixel + click-link tracking (Phase 2B).
      react: CampaignEmail({
        body: campaign.body,
        firstName: r.firstName,
        recipientId: r.id,
        unsubscribeUrl: unsub,
      }),
      from,
      replyTo,
      tags: [{ name: "category", value: "campaign" }],
      // One-click unsubscribe (RFC 8058) + visible footer link.
      headers: {
        "List-Unsubscribe": `<${unsub}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      // Dedupe at the provider in case of an accidental double-fire.
      idempotencyKey: `campaign_${campaign.id}_recipient_${r.id}`,
    });
    if (!res.ok) {
      failed += 1;
      console.error(`[campaigns] send failed for recipient ${r.id}: ${res.error}`);
      continue;
    }
    sentRecipientIds.push(r.id);
    events.push({
      recipientId: r.id,
      type: "SENT",
      metadata: { messageId: res.id } as Prisma.InputJsonValue,
    });
  }

  // Nothing delivered — leave the campaign DRAFT so the user can retry.
  if (sentRecipientIds.length === 0) {
    return {
      ok: false,
      error:
        suppressed > 0
          ? "No emails sent — every recipient is unsubscribed or suppressed."
          : "No emails could be sent. Check recipient addresses and try again.",
    };
  }

  const sentAt = new Date();
  await prisma.$transaction([
    prisma.emailRecipient.updateMany({
      where: { id: { in: sentRecipientIds }, status: "PENDING" },
      data: { status: "SENT", sentAt },
    }),
    prisma.emailEvent.createMany({ data: events }),
    prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: "RUNNING" },
    }),
  ]);

  await logAudit({
    organizationId: orgId,
    actorUserId: session.user.id,
    action: "campaign.sent",
    resource: "campaign",
    resourceId: campaign.id,
    metadata: {
      campaignId: campaign.id,
      recipientCount: sentRecipientIds.length,
      failedCount: failed,
    },
  });

  // Phase 3 — if a followup sequence is attached, enroll the sent recipients.
  // The scheduler takes it from here (see lib/email/sequence-runner.ts).
  if (campaign.sequenceId) {
    const enrolled = await enrollSentRecipients(
      campaign.sequenceId,
      sentRecipientIds,
      sentAt
    );
    if (enrolled > 0) {
      await logAudit({
        organizationId: orgId,
        actorUserId: session.user.id,
        action: "recipient.enrolled",
        resource: "campaign",
        resourceId: campaign.id,
        metadata: { sequenceId: campaign.sequenceId, count: enrolled },
      });
    }
  }

  revalidatePath(`/dashboard/campaigns/${campaign.id}`);
  revalidatePath("/dashboard/campaigns");
  return { ok: true, sent: sentRecipientIds.length, failed, suppressed };
}
