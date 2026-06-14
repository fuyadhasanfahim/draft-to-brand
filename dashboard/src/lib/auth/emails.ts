import "server-only";
import { sendEmail } from "@/lib/email";
import { EMAIL_SUBJECTS } from "@/lib/email/email-config";
import {
  PasswordResetEmail,
  VerificationCodeEmail,
  WelcomeEmail,
} from "@/emails";

/**
 * Auth-side email orchestration.
 *
 * Thin wrappers so Better Auth callbacks stay tiny and any future flow
 * (invitations, member onboarding) lives next to verification/reset without
 * leaking template details into auth/server.ts.
 *
 * Best-effort — auth never fails because Resend hiccuped.
 */

export async function sendVerificationCodeEmail(args: {
  to: string;
  name?: string;
  code: string;
}) {
  const result = await sendEmail({
    to: args.to,
    subject: EMAIL_SUBJECTS.verification,
    react: VerificationCodeEmail({ name: args.name, code: args.code }),
    tags: [{ name: "category", value: "auth_verification_code" }],
  });
  if (!result.ok) console.error("[auth] verification-code email failed", result.error);
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
    react: PasswordResetEmail({ name: args.name, resetUrl: args.resetUrl }),
    tags: [{ name: "category", value: "auth_password_reset" }],
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
    tags: [{ name: "category", value: "auth_welcome" }],
  });
  if (!result.ok) console.error("[auth] welcome email failed", result.error);
  return result;
}
