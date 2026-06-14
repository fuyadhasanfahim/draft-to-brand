import "server-only";
import { sendEmail } from "@/lib/email";
import { EMAIL_SUBJECTS } from "@/lib/email/email-config";
import {
  PasswordResetEmail,
  VerificationEmail,
  WelcomeEmail,
} from "@/emails";

/**
 * Auth-side email orchestration.
 *
 * These thin wrappers exist so Better Auth callbacks stay tiny and so any
 * future flow (e.g. invitations) can sit next to verification/reset without
 * leaking template details into auth/server.ts.
 *
 * All functions are best-effort: they swallow transport errors and only log
 * them. Authentication MUST NOT fail because Resend hiccuped.
 */

export async function sendVerificationEmail(args: {
  to: string;
  name?: string;
  verifyUrl: string;
}) {
  const result = await sendEmail({
    to: args.to,
    subject: EMAIL_SUBJECTS.verification,
    react: VerificationEmail({
      name: args.name,
      verifyUrl: args.verifyUrl,
    }),
    tags: [{ name: "category", value: "auth.verification" }],
  });
  if (!result.ok) console.error("[auth] verification email failed", result.error);
  return result;
}

export async function sendPasswordResetEmail(args: {
  to: string;
  name?: string;
  resetUrl: string;
}) {
  const result = await sendEmail({
    to: args.to,
    subject: EMAIL_SUBJECTS.passwordReset,
    react: PasswordResetEmail({
      name: args.name,
      resetUrl: args.resetUrl,
    }),
    tags: [{ name: "category", value: "auth.password-reset" }],
  });
  if (!result.ok) console.error("[auth] reset email failed", result.error);
  return result;
}

export async function sendWelcomeEmail(args: {
  to: string;
  name?: string;
  workspaceName?: string;
}) {
  const result = await sendEmail({
    to: args.to,
    subject: EMAIL_SUBJECTS.welcome,
    react: WelcomeEmail({
      name: args.name,
      workspaceName: args.workspaceName,
    }),
    tags: [{ name: "category", value: "auth.welcome" }],
  });
  if (!result.ok) console.error("[auth] welcome email failed", result.error);
  return result;
}
