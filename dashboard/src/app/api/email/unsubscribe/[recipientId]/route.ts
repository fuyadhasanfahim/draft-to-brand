import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addSuppression } from "@/lib/email/suppression";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { BRAND } from "@/lib/constants/brand";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * /api/email/unsubscribe/[recipientId]?token=...
 *
 * Public (no auth). The token is an HMAC of the recipient id, so only the actual
 * recipient's link works.
 *
 *   - GET  → renders a confirmation page with a one-click button. Does NOT mutate
 *            (so email-scanner prefetch can't auto-unsubscribe).
 *   - POST → performs the opt-out: adds the recipient's email to the org
 *            suppression list (Do Not Contact). Used by the on-page button AND by
 *            RFC 8058 `List-Unsubscribe-Post` one-click from inbox clients.
 */

async function resolve(recipientId: string, token: string | null) {
  if (!verifyUnsubscribeToken(recipientId, token)) return null;
  return prisma.emailRecipient.findUnique({
    where: { id: recipientId },
    select: { id: true, email: true, campaign: { select: { organizationId: true } } },
  });
}

function page(opts: { title: string; message: string; form?: { action: string } }): NextResponse {
  const button = opts.form
    ? `<form method="POST" action="${opts.form.action}">
         <button type="submit">Unsubscribe</button>
       </form>`
    : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${opts.title}</title>
    <style>
      body{margin:0;background:${BRAND.colors.background};color:${BRAND.colors.text};
        font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
        display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
      .card{background:${BRAND.colors.surface};border:1px solid ${BRAND.colors.border};
        border-radius:14px;max-width:440px;width:100%;padding:32px;text-align:center;
        box-shadow:0 1px 2px rgba(40,42,42,.05)}
      h1{font-size:18px;margin:0 0 8px}
      p{font-size:14px;line-height:1.6;color:${BRAND.colors.mutedText};margin:0 0 20px}
      button{appearance:none;border:0;border-radius:10px;background:${BRAND.colors.primary};
        color:#fff;font-size:14px;font-weight:600;padding:11px 20px;cursor:pointer}
    </style></head>
    <body><div class="card"><h1>${opts.title}</h1><p>${opts.message}</p>${button}</div></body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recipientId: string }> }
) {
  const { recipientId } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const recipient = await resolve(recipientId, token);

  if (!recipient) {
    return page({ title: "Link no longer valid", message: "This unsubscribe link is invalid or has expired." });
  }
  // Confirmation page — the POST does the actual opt-out.
  return page({
    title: `Unsubscribe from ${BRAND.name}`,
    message: `Confirm that you no longer want to receive emails at <strong>${recipient.email}</strong>.`,
    form: { action: `/api/email/unsubscribe/${encodeURIComponent(recipientId)}?token=${encodeURIComponent(token ?? "")}` },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ recipientId: string }> }
) {
  const { recipientId } = await params;
  const token = req.nextUrl.searchParams.get("token");
  const recipient = await resolve(recipientId, token);

  if (!recipient?.email) {
    return page({ title: "Link no longer valid", message: "This unsubscribe link is invalid or has expired." });
  }

  await addSuppression({
    organizationId: recipient.campaign.organizationId,
    email: recipient.email,
    reason: "UNSUBSCRIBE",
    source: `recipient:${recipientId}`,
  });

  return page({
    title: "You're unsubscribed",
    message: `<strong>${recipient.email}</strong> will no longer receive emails from ${BRAND.name}.`,
  });
}
