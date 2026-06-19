import { NextResponse } from "next/server";
import { runSequenceScheduler } from "@/lib/email/sequence-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Followup sends are sequential; give the run room. (Vercel caps by plan.)
export const maxDuration = 60;

/**
 * GET /api/cron/sequences
 *
 * The followup scheduler tick. Processes a bounded batch of due enrollments
 * (see runSequenceScheduler). Triggered by Vercel Cron (configured in
 * vercel.json), which sends `Authorization: Bearer <CRON_SECRET>` automatically.
 *
 * Auth: requires the bearer token to equal `CRON_SECRET`. If `CRON_SECRET` is
 * unset we reject in production and allow in dev (with a warning) so the tick
 * can be exercised locally. This is the poll-based MVP; the body is queue-ready
 * (each enrollment is processed independently + idempotently).
 */
export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const authorized = req.headers.get("authorization") === `Bearer ${secret}`;

  if (secret) {
    if (!authorized) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[cron/sequences] CRON_SECRET missing in production — refusing to run");
    return new NextResponse("Cron not configured", { status: 500 });
  } else {
    console.warn("[cron/sequences] CRON_SECRET unset — running without auth (dev only)");
  }

  try {
    const summary = await runSequenceScheduler({ limit: 200 });
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron/sequences] scheduler run failed", err);
    return new NextResponse("Scheduler error", { status: 500 });
  }
}
