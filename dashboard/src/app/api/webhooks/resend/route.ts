import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { recordBounce, recordComplaint } from "@/lib/email/tracking-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/webhooks/resend
 *
 * Inbound Resend (Svix-signed) webhook. This phase handles `email.bounced`
 * only — opens and clicks are tracked by our own pixel/link routes, so we
 * deliberately ignore Resend's open/click events to avoid double counting.
 *
 * Correlation reuses the Phase 2A convention: the provider message id is stored
 * in the recipient's SENT event metadata (`{ messageId }`). We look the
 * recipient up by that id and record the bounce (first-bounce-wins).
 *
 * Signature verification uses the Svix scheme (HMAC-SHA256) implemented with
 * node:crypto — no new dependency. If `RESEND_WEBHOOK_SECRET` is unset we skip
 * verification (dev) and warn; in production it should always be set.
 */
export async function POST(req: Request) {
  const payload = await req.text(); // raw body required for signature check
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (secret) {
    if (!verifySvixSignature(secret, req.headers, payload)) {
      return new NextResponse("Invalid signature", { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[webhooks/resend] RESEND_WEBHOOK_SECRET missing in production — rejecting");
    return new NextResponse("Webhook not configured", { status: 500 });
  } else {
    console.warn("[webhooks/resend] RESEND_WEBHOOK_SECRET unset — skipping verification (dev)");
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(payload) as ResendEvent;
  } catch {
    return new NextResponse("Bad payload", { status: 400 });
  }

  // Action bounces + complaints (both suppress the address). Opens/clicks are
  // tracked by our own pixel/link routes; acknowledge everything else so Resend
  // doesn't retry.
  if (event.type !== "email.bounced" && event.type !== "email.complained") {
    return NextResponse.json({ ok: true, ignored: event.type ?? "unknown" });
  }

  const messageId = event.data?.email_id;
  if (!messageId) {
    return NextResponse.json({ ok: true, ignored: "no_message_id" });
  }

  // Correlate provider message id → recipient via the SENT event metadata.
  const sentEvent = await prisma.emailEvent.findFirst({
    where: { type: "SENT", metadata: { path: ["messageId"], equals: messageId } },
    select: { recipientId: true },
  });
  if (!sentEvent) {
    return NextResponse.json({ ok: true, ignored: "unknown_message" });
  }

  try {
    if (event.type === "email.bounced") {
      await recordBounce(sentEvent.recipientId, event);
    } else {
      await recordComplaint(sentEvent.recipientId);
    }
  } catch (err) {
    console.error("[webhooks/resend] failed to process event", err);
    return new NextResponse("Processing error", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

type ResendEvent = {
  type?: string;
  data?: { email_id?: string; [k: string]: unknown };
  [k: string]: unknown;
};

/**
 * Verify a Svix-signed webhook (the scheme Resend uses).
 *
 * signedContent = `${svix-id}.${svix-timestamp}.${rawBody}`
 * expected      = base64( HMAC_SHA256(secretBytes, signedContent) )
 * The `svix-signature` header is a space-separated list of `v1,<sig>` entries;
 * the request is valid if any entry matches (constant-time compare).
 */
function verifySvixSignature(
  secret: string,
  headers: Headers,
  payload: string
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatureHeader = headers.get("svix-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");
  const expectedBuf = Buffer.from(expected);

  return signatureHeader.split(" ").some((entry) => {
    const sig = entry.split(",")[1]; // "v1,<base64sig>"
    if (!sig) return false;
    const sigBuf = Buffer.from(sig);
    if (sigBuf.length !== expectedBuf.length) return false;
    try {
      return crypto.timingSafeEqual(sigBuf, expectedBuf);
    } catch {
      return false;
    }
  });
}
