import { BRAND } from "@/lib/constants/brand";

/**
 * Centralized builders for the email-tracking URLs (Phase 2B).
 *
 * One place owns the route shape so the email template and the route handlers
 * can never drift. URLs are absolute (emails render outside our origin) and
 * built from `NEXT_PUBLIC_APP_URL` via `BRAND.url`.
 */

/** Strip a trailing slash so we don't emit `//api/...`. */
function base(): string {
  return BRAND.url.replace(/\/$/, "");
}

/** 1×1 open-tracking pixel endpoint for a recipient. */
export function openPixelUrl(recipientId: string): string {
  return `${base()}/api/email/open/${encodeURIComponent(recipientId)}`;
}

/**
 * Click-tracking wrapper for an outbound link. The original destination is
 * carried in the `url` query param; the route validates + redirects to it.
 */
export function clickTrackingUrl(recipientId: string, destination: string): string {
  return `${base()}/api/email/click/${encodeURIComponent(recipientId)}?url=${encodeURIComponent(
    destination
  )}`;
}
