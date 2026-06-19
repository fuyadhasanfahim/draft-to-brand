import "server-only";
import crypto from "node:crypto";
import { BRAND } from "@/lib/constants/brand";

/**
 * One-click unsubscribe tokens (production hardening).
 *
 * The unsubscribe link carries `recipientId` + an HMAC token so a recipient can
 * only unsubscribe themselves — the id alone (a cuid) is guessable, the token is
 * not. Reuses `BETTER_AUTH_SECRET` as the signing key (server-only; never sent
 * to the client beyond the derived token).
 */
function signingKey(): string {
  // Fall back to a constant only matters in dev; in prod BETTER_AUTH_SECRET is
  // always set (auth depends on it).
  return process.env.BETTER_AUTH_SECRET ?? "dev-unsubscribe-secret";
}

export function unsubscribeToken(recipientId: string): string {
  return crypto
    .createHmac("sha256", signingKey())
    .update(`unsubscribe:${recipientId}`)
    .digest("base64url");
}

export function verifyUnsubscribeToken(recipientId: string, token: string | null): boolean {
  if (!token) return false;
  const expected = unsubscribeToken(recipientId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Absolute one-click unsubscribe URL for a recipient (GET page + POST one-click). */
export function unsubscribeUrl(recipientId: string): string {
  const base = BRAND.url.replace(/\/$/, "");
  return `${base}/api/email/unsubscribe/${encodeURIComponent(recipientId)}?token=${unsubscribeToken(
    recipientId
  )}`;
}
