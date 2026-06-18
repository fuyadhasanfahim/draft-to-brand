import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recordOpen } from "@/lib/email/tracking-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/email/open/[recipientId]
 *
 * Open-tracking pixel. Public (no auth — it loads inside the recipient's inbox).
 * Always returns a 1×1 transparent GIF as fast as possible; the tracking write
 * is best-effort and never blocks (or fails) the image response.
 *
 * First open wins: `recordOpen` is gated on `openedAt IS NULL`, so repeated
 * inbox renders / proxy prefetches don't create duplicate OPENED events.
 */

// 1×1 transparent GIF (43 bytes).
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function pixel(): NextResponse {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL.length),
      // Defeat inbox/proxy caching so re-renders still hit us (and so a cached
      // pixel can't suppress a genuine later open from a different client).
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recipientId: string }> }
) {
  const { recipientId } = await params;
  try {
    const recipient = await prisma.emailRecipient.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (recipient) {
      await recordOpen(recipientId);
    }
  } catch (err) {
    // Tracking must never break the pixel — log and serve the image anyway.
    console.error("[tracking] open failed", err);
  }
  return pixel();
}
