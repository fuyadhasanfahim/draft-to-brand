"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { getAuthUser } from "@/lib/auth/session";
import {
  clearVerificationFailures,
  getEmailQuotaStatus,
  isVerificationLocked,
  recordVerificationFailure,
  type EmailQuotaStatus,
} from "@/lib/auth/email-rate-limit";

/**
 * UI-facing verification actions.
 *
 * Why these exist instead of calling `authClient.emailOtp.*` directly:
 *
 *   - Failure recording for the lockout counter MUST happen server-side
 *     after every wrong code. Doing it client-side would let an attacker
 *     skip the increment by ignoring the response.
 *   - Cooldown / quota state for the resend button MUST be hydrated from
 *     the server on mount so it survives refresh, restart, tabs.
 *
 * Both actions enforce that the *currently signed-in user* can only act
 * on their own email — no cross-account abuse.
 */

type VerifyResult = { ok: true } | { ok: false; error: string; retryAfterSeconds?: number };

async function assertOwnEmail(email: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (user.email.toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/**
 * Verifies the OTP and records the result for the lockout counter.
 *
 *   - Lockout check happens BEFORE we call Better Auth, so even guessing
 *     a code on a locked account is impossible.
 *   - Failures are recorded after Better Auth rejects, so the 5/15min
 *     budget is real.
 *   - Successes clear the counter — a verified user starts fresh.
 */
export async function verifyEmailOtpAction(args: {
  email: string;
  otp: string;
}): Promise<VerifyResult> {
  await assertOwnEmail(args.email);

  const lock = await isVerificationLocked(args.email);
  if (lock.locked) {
    return {
      ok: false,
      error: `Too many incorrect attempts. Try again in ${Math.ceil(
        lock.retryAfterSeconds / 60
      )} minutes.`,
      retryAfterSeconds: lock.retryAfterSeconds,
    };
  }

  try {
    await auth.api.verifyEmailOTP({
      body: { email: args.email, otp: args.otp },
      headers: await headers(),
    });
    await clearVerificationFailures(args.email);
    return { ok: true };
  } catch (err) {
    await recordVerificationFailure(args.email);
    // Re-check lockout after recording — the 5th wrong attempt should
    // surface the lockout message immediately.
    const after = await isVerificationLocked(args.email);
    if (after.locked) {
      return {
        ok: false,
        error: `Too many incorrect attempts. Try again in ${Math.ceil(
          after.retryAfterSeconds / 60
        )} minutes.`,
        retryAfterSeconds: after.retryAfterSeconds,
      };
    }
    const message = err instanceof Error ? err.message : "Invalid code";
    return { ok: false, error: message };
  }
}

/**
 * Sends a new verification code via Better Auth. The send-rate quota and
 * lockout are enforced inside the BA `sendVerificationOTP` callback —
 * this action exists so the UI can surface server errors as toast bodies.
 */
export async function sendVerificationOtpAction(
  email: string
): Promise<VerifyResult> {
  await assertOwnEmail(email);

  try {
    await auth.api.sendVerificationOTP({
      body: { email, type: "email-verification" },
      headers: await headers(),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't send code";
    return { ok: false, error: message };
  }
}

/**
 * Server-authoritative cooldown / window status for the resend button.
 * Called on mount AND after every send so the countdown is always
 * anchored to a real DB row, never to React's `setTimeout`.
 */
export async function getVerificationCooldownAction(
  email: string
): Promise<EmailQuotaStatus & { locked: boolean; lockRetryAfterSeconds: number }> {
  await assertOwnEmail(email);

  const [status, lock] = await Promise.all([
    getEmailQuotaStatus({ identifier: email, scope: "VERIFICATION_OTP_SENT" }),
    isVerificationLocked(email),
  ]);

  return {
    ...status,
    locked: lock.locked,
    lockRetryAfterSeconds: lock.retryAfterSeconds,
  };
}
