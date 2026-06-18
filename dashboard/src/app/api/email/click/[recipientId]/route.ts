import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordClick } from "@/lib/email/tracking-events";
import { isSafeUrl } from "@/lib/safe-url";
import { BRAND } from "@/lib/constants/brand";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/email/click/[recipientId]?url=<destination>
 *
 * Click-tracking redirect. Public (no auth — clicked from the inbox). Records
 * the first click, then 302-redirects to the original destination.
 *
 * Safety: the destination is validated with `isSafeUrl` (http/https only) to
 * prevent the endpoint becoming an open redirect to `javascript:`/`data:` or
 * arbitrary schemes. An unsafe/missing `url` falls back to the app home.
 *
 * First click wins: `recordClick` is gated on `clickedAt IS NULL`, so a double
 * click / prefetch won't create duplicate CLICKED events. Status advances
 * SENT/OPENED → CLICKED and never downgrades.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recipientId: string }> }
) {
  const { recipientId } = await params;
  const safeDestination = isSafeUrl(req.nextUrl.searchParams.get("url"));
  const redirectTo = safeDestination ?? BRAND.url;

  try {
    if (safeDestination) {
      const recipient = await prisma.emailRecipient.findUnique({
        where: { id: recipientId },
        select: { id: true },
      });
      if (recipient) {
        await recordClick(recipientId, safeDestination);
      }
    }
  } catch (err) {
    // Never trap the user — log and redirect regardless of tracking outcome.
    console.error("[tracking] click failed", err);
  }

  return NextResponse.redirect(redirectTo, 302);
}
