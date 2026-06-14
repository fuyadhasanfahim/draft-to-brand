import "server-only";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { resend } from "./resend";
import { EMAIL_CONFIG } from "./email-config";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  /** A React Email template. Rendered to HTML + plaintext automatically. */
  react: ReactElement;
  /** Optional per-send overrides. */
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
  /** Optional idempotency key for Resend deduplication. */
  idempotencyKey?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Resend's tag validator only accepts `[A-Za-z0-9_-]` for both name and
 * value (max 256 chars each). We coerce anything else to underscores so a
 * stray dot, space, or accented character in a future caller can't turn
 * into a 422 at delivery time. Empty results are dropped.
 */
const TAG_ALLOWED = /[^A-Za-z0-9_-]/g;
function sanitizeTags(
  tags: { name: string; value: string }[]
): { name: string; value: string }[] {
  return tags
    .map((t) => ({
      name: t.name.replace(TAG_ALLOWED, "_").slice(0, 256),
      value: t.value.replace(TAG_ALLOWED, "_").slice(0, 256),
    }))
    .filter((t) => t.name.length > 0 && t.value.length > 0);
}

/**
 * Production email send.
 *
 * - Renders the React Email template to HTML + plain-text in one pass.
 * - Catches all transport errors and returns a discriminated result —
 *   callers (Better Auth callbacks, server actions) decide whether to
 *   surface or retry. This function never throws on transport failure.
 * - In dev, logs the rendered email to the console when RESEND_API_KEY
 *   is missing so flows can be tested without a key.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const html = await render(input.react);
  const text = await render(input.react, { plainText: true });

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[email] RESEND_API_KEY missing — skipping send to ${Array.isArray(input.to) ? input.to.join(",") : input.to}\n` +
          `        subject: ${input.subject}\n` +
          `        plain text follows:\n${text}\n`
      );
      return { ok: true, id: "dev-noop" };
    }
    return { ok: false, error: "RESEND_API_KEY missing in production" };
  }

  try {
    const { data, error } = await resend.emails.send(
      {
        from: input.from ?? EMAIL_CONFIG.from,
        to: input.to,
        subject: input.subject,
        html,
        text,
        replyTo: input.replyTo ?? EMAIL_CONFIG.replyTo,
        tags: sanitizeTags(input.tags ?? EMAIL_CONFIG.tags.transactional()),
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined
    );

    if (error || !data) {
      console.error("[email] send failed", error);
      return { ok: false, error: error?.message ?? "unknown send error" };
    }

    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[email] transport error", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
