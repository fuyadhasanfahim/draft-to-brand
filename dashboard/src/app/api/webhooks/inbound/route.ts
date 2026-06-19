import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordReply } from "@/lib/email/tracking-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/webhooks/inbound
 *
 * Reply detection (production hardening). Resend's standard webhook does NOT
 * emit reply events — replies land in the campaign's reply-to mailbox. So reply
 * detection requires an inbound-email feed: configure inbound parsing (Resend
 * Inbound, SendGrid Inbound Parse, Mailgun Routes, or a mailbox forward) to POST
 * the reply here. This endpoint is intentionally provider-agnostic — it reads
 * the common field shapes and correlates to recipient(s).
 *
 * This is NOT an inbox: it stores no message body and renders no conversation.
 * It only flips the recipient to REPLIED (+ REPLIED event) and stops the
 * recipient's active sequence enrollments (see recordReply).
 *
 * Auth: `Authorization: Bearer <INBOUND_WEBHOOK_SECRET>`. Unset → rejected in
 * prod, allowed in dev with a warning.
 *
 * Correlation:
 *   1. opportunistic: `in-reply-to` message id against SENT/FOLLOWUP_SENT events.
 *   2. primary: the reply's sender email → non-terminal recipients with that
 *      address. (Shared-mailbox MVP — see PRODUCTION_HARDENING.md for the
 *      tenancy caveat.)
 */
export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.INBOUND_WEBHOOK_SECRET;
  const authorized = req.headers.get("authorization") === `Bearer ${secret}`;
  if (secret) {
    if (!authorized) return new NextResponse("Unauthorized", { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    console.error("[webhooks/inbound] INBOUND_WEBHOOK_SECRET missing in production — rejecting");
    return new NextResponse("Webhook not configured", { status: 500 });
  } else {
    console.warn("[webhooks/inbound] INBOUND_WEBHOOK_SECRET unset — skipping auth (dev)");
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse("Bad payload", { status: 400 });
  }

  const from = extractEmail(pick(payload, ["from", "sender", "From"]));
  const inReplyTo = cleanMessageId(pick(payload, ["inReplyTo", "in_reply_to", "In-Reply-To"]));

  const recipientIds = new Set<string>();

  // 1) Opportunistic correlation by the In-Reply-To message id.
  if (inReplyTo) {
    const ev = await prisma.emailEvent.findFirst({
      where: {
        type: { in: ["SENT", "FOLLOWUP_SENT"] },
        metadata: { path: ["messageId"], equals: inReplyTo },
      },
      select: { recipientId: true },
    });
    if (ev) recipientIds.add(ev.recipientId);
  }

  // 2) Primary correlation by sender email → non-terminal recipients.
  if (from) {
    const matches = await prisma.emailRecipient.findMany({
      where: { email: from, status: { in: ["SENT", "OPENED", "CLICKED"] } },
      select: { id: true },
      take: 100,
    });
    for (const m of matches) recipientIds.add(m.id);
  }

  if (recipientIds.size === 0) {
    return NextResponse.json({ ok: true, matched: 0 });
  }

  let replied = 0;
  for (const id of recipientIds) {
    try {
      if (await recordReply(id)) replied += 1;
    } catch (err) {
      console.error(`[webhooks/inbound] recordReply failed for ${id}`, err);
    }
  }
  return NextResponse.json({ ok: true, matched: recipientIds.size, replied });
}

function pick(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/** Extract a lowercased email address from a raw "Name <email>" or bare string. */
function extractEmail(raw: string | null): string | null {
  if (!raw) return null;
  const angle = /<([^>]+)>/.exec(raw);
  const candidate = (angle ? angle[1] : raw).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null;
}

function cleanMessageId(raw: string | null): string | null {
  if (!raw) return null;
  return raw.trim().replace(/^<|>$/g, "") || null;
}
