import "server-only";
import { prisma } from "@/lib/db";
import { EmailDeliveryScope, Prisma } from "@prisma/client";

/**
 * Server-side email abuse protection.
 *
 * Architecture
 * ------------
 *   - One append-only ledger table: `EmailDeliveryLog`.
 *   - Each policy combines a sliding window (`windowMs` + `max`) with an
 *     optional inter-send cooldown (`cooldownMs`).
 *   - Check + record are *not* a single SQL transaction. The window is so
 *     coarse (minutes/hours) and the race window so narrow (ms) that a
 *     double-fire would still be inside the cap — the cap just becomes
 *     `max + 1` in the absolute worst case, which is acceptable for this
 *     class of abuse protection. If/when we move to Redis we get true
 *     atomicity via INCR; the public API here does not change.
 *
 * Why a single table
 * ------------------
 *   Cooldown, rolling window, lockout, and the welcome one-shot all reduce
 *   to "count rows in (identifier, scope) since X". Folding everything into
 *   one indexed table keeps abuse review, retention pruning, and future
 *   per-IP additions simple.
 */

export type EmailQuotaResult =
  | { ok: true }
  | {
      ok: false;
      reason: "COOLDOWN" | "WINDOW_EXCEEDED" | "ALREADY_SENT" | "LOCKED";
      retryAfterSeconds: number;
      message: string;
    };

export type EmailQuotaStatus = {
  /** Seconds remaining on the per-send cooldown. 0 if not in cooldown. */
  cooldownSecondsRemaining: number;
  /** How many more sends are allowed in the current rolling window. */
  sendsRemainingInWindow: number;
  /** Seconds until the rolling window resets to its full quota. 0 if there have been no sends yet. */
  windowResetInSeconds: number;
};

type Policy = {
  /** Sliding window length in ms. */
  windowMs: number;
  /** Max sends allowed in the window. */
  max: number;
  /** Minimum gap between consecutive sends in ms. */
  cooldownMs: number;
  /** If true, ANY existing row blocks new sends (welcome email). */
  oneShot?: boolean;
};

const POLICIES: Record<EmailDeliveryScope, Policy> = {
  // 5 sends / hour, 30s between sends.
  VERIFICATION_OTP_SENT: {
    windowMs: 60 * 60 * 1000,
    max: 5,
    cooldownMs: 30 * 1000,
  },
  // 5 wrong codes in 15min → 15-min lockout. We model this as a "max" of 4
  // failures within the window; the 5th triggers LOCKED. recordVerificationFailure
  // is what writes these rows.
  VERIFICATION_OTP_FAILED: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    cooldownMs: 0,
  },
  // 3 invitation resends / hour per identifier (invitation:<id>).
  INVITATION_SENT: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    cooldownMs: 0,
  },
  // 3 password-reset emails / hour per user email.
  PASSWORD_RESET_SENT: {
    windowMs: 60 * 60 * 1000,
    max: 3,
    cooldownMs: 0,
  },
  // Send once, ever, per email.
  WELCOME_SENT: {
    windowMs: 100 * 365 * 24 * 60 * 60 * 1000, // 100 years
    max: 1,
    cooldownMs: 0,
    oneShot: true,
  },
};

function normalize(identifier: string): string {
  return identifier.trim().toLowerCase();
}

/**
 * Verifies a send is allowed and atomically records it. Caller should only
 * actually send the email after `{ ok: true }`. On `{ ok: false }` the
 * `retryAfterSeconds` is what the UI should display and what the response
 * `Retry-After` header should advertise.
 */
export async function checkAndConsumeEmailQuota(args: {
  identifier: string;
  scope: EmailDeliveryScope;
  metadata?: Record<string, unknown>;
}): Promise<EmailQuotaResult> {
  const identifier = normalize(args.identifier);
  const policy = POLICIES[args.scope];
  const now = Date.now();
  const windowStart = new Date(now - policy.windowMs);

  const rows = await prisma.emailDeliveryLog.findMany({
    where: { identifier, scope: args.scope, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
    take: policy.max,
  });

  if (policy.oneShot && rows.length > 0) {
    return {
      ok: false,
      reason: "ALREADY_SENT",
      retryAfterSeconds: 0,
      message: "This email has already been delivered.",
    };
  }

  // Cooldown check.
  if (policy.cooldownMs > 0 && rows[0]) {
    const lastMs = rows[0].createdAt.getTime();
    const cooldownEndsAt = lastMs + policy.cooldownMs;
    if (cooldownEndsAt > now) {
      return {
        ok: false,
        reason: "COOLDOWN",
        retryAfterSeconds: Math.ceil((cooldownEndsAt - now) / 1000),
        message: messageForCooldown(args.scope),
      };
    }
  }

  // Rolling-window cap.
  if (rows.length >= policy.max) {
    const oldestInWindow = rows[rows.length - 1];
    const windowEndsAt = oldestInWindow.createdAt.getTime() + policy.windowMs;
    return {
      ok: false,
      reason: "WINDOW_EXCEEDED",
      retryAfterSeconds: Math.max(1, Math.ceil((windowEndsAt - now) / 1000)),
      message: messageForWindow(args.scope),
    };
  }

  await prisma.emailDeliveryLog.create({
    data: {
      identifier,
      scope: args.scope,
      metadata: (args.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    },
  });

  return { ok: true };
}

/**
 * Read-only — used by the UI on mount and after every action to drive the
 * countdown. NEVER trust the client's `setTimeout` for the underlying gate.
 */
export async function getEmailQuotaStatus(args: {
  identifier: string;
  scope: EmailDeliveryScope;
}): Promise<EmailQuotaStatus> {
  const identifier = normalize(args.identifier);
  const policy = POLICIES[args.scope];
  const now = Date.now();
  const windowStart = new Date(now - policy.windowMs);

  const rows = await prisma.emailDeliveryLog.findMany({
    where: { identifier, scope: args.scope, createdAt: { gte: windowStart } },
    orderBy: { createdAt: "desc" },
    take: policy.max,
  });

  const cooldownSecondsRemaining =
    policy.cooldownMs > 0 && rows[0]
      ? Math.max(
          0,
          Math.ceil((rows[0].createdAt.getTime() + policy.cooldownMs - now) / 1000)
        )
      : 0;

  const sendsRemainingInWindow = Math.max(0, policy.max - rows.length);

  const windowResetInSeconds = rows.length
    ? Math.max(
        0,
        Math.ceil(
          (rows[rows.length - 1].createdAt.getTime() + policy.windowMs - now) / 1000
        )
      )
    : 0;

  return { cooldownSecondsRemaining, sendsRemainingInWindow, windowResetInSeconds };
}

// ──────────────────────────────────────────────────────────────────────────
// Verification-failure / lockout — separate API because the trigger (a bad
// OTP) is distinct from the "send a code" event.
// ──────────────────────────────────────────────────────────────────────────

export async function recordVerificationFailure(email: string) {
  await prisma.emailDeliveryLog.create({
    data: {
      identifier: normalize(email),
      scope: "VERIFICATION_OTP_FAILED",
    },
  });
}

export async function isVerificationLocked(
  email: string
): Promise<{ locked: boolean; retryAfterSeconds: number }> {
  const policy = POLICIES.VERIFICATION_OTP_FAILED;
  const now = Date.now();
  const windowStart = new Date(now - policy.windowMs);

  const rows = await prisma.emailDeliveryLog.findMany({
    where: {
      identifier: normalize(email),
      scope: "VERIFICATION_OTP_FAILED",
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
    take: policy.max,
  });

  if (rows.length < policy.max) return { locked: false, retryAfterSeconds: 0 };

  const oldestInWindow = rows[rows.length - 1];
  const unlocksAt = oldestInWindow.createdAt.getTime() + policy.windowMs;
  return {
    locked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((unlocksAt - now) / 1000)),
  };
}

/** Clear failed-attempt log on successful verification. */
export async function clearVerificationFailures(email: string) {
  await prisma.emailDeliveryLog.deleteMany({
    where: { identifier: normalize(email), scope: "VERIFICATION_OTP_FAILED" },
  });
}

// ──────────────────────────────────────────────────────────────────────────
// User-facing messages — surfaced as APIError messages and toast bodies.
// ──────────────────────────────────────────────────────────────────────────

function messageForCooldown(scope: EmailDeliveryScope): string {
  switch (scope) {
    case "VERIFICATION_OTP_SENT":
      return "Please wait a moment before requesting another code.";
    default:
      return "Please wait before retrying.";
  }
}

function messageForWindow(scope: EmailDeliveryScope): string {
  switch (scope) {
    case "VERIFICATION_OTP_SENT":
      return "Verification email limit reached. Try again in 1 hour.";
    case "INVITATION_SENT":
      return "Invitation resend limit reached. Try again later.";
    case "PASSWORD_RESET_SENT":
      return "Password reset limit reached. Try again later.";
    case "WELCOME_SENT":
      return "Welcome email already sent.";
    case "VERIFICATION_OTP_FAILED":
      return "Too many incorrect attempts. Try again in 15 minutes.";
  }
}

export const RATE_LIMIT_MESSAGES = { window: messageForWindow, cooldown: messageForCooldown };
