import { betterAuth, APIError } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins/email-otp";
import { createAuthMiddleware } from "better-auth/api";
import { prisma } from "@/lib/db";
import {
  sendPasswordResetEmail,
  sendVerificationCodeEmail,
  sendWelcomeEmail,
} from "./emails";
import {
  acceptInvitationForUser,
  getPendingInvitationByEmail,
} from "./invitations";
import { currentInvitationToken } from "./invitation-context";
import {
  checkAndConsumeEmailQuota,
  isVerificationLocked,
} from "./email-rate-limit";

/**
 * Better Auth is the authentication layer ONLY.
 * Business identity (Member, Role, Permission) lives separately in the agency schema.
 *
 * Email abuse protection is centralized in `email-rate-limit.ts`. Every
 * outbound send goes through `checkAndConsumeEmailQuota` BEFORE the
 * transport call — never trust the client. The `hooks.before` middleware
 * also blocks direct-API verify attempts when an email is locked out.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    sendResetPassword: async ({ user, url }) => {
      const quota = await checkAndConsumeEmailQuota({
        identifier: user.email,
        scope: "PASSWORD_RESET_SENT",
      });
      if (!quota.ok) {
        throw new APIError("TOO_MANY_REQUESTS", { message: quota.message });
      }
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? undefined,
        resetUrl: url,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  databaseHooks: {
    user: {
      create: {
        // GATE (Critical #4): signup requires the invitation token from the
        // recipient's email link to be present in the request's ALS context.
        // The only legitimate caller (acceptInvitationAction) wraps the
        // BA call with `withInvitationToken(token, …)`. Direct hits to
        // /api/auth/sign-up/email with no token are rejected — and the
        // token must match a PENDING invitation FOR THIS EMAIL, so a
        // collision between unrelated invitations is impossible.
        before: async (user) => {
          const token = currentInvitationToken();
          if (!token) {
            throw new APIError("FORBIDDEN", {
              message:
                "Sign-up is invitation-only. Use the invitation link sent to your email.",
            });
          }
          const inv = await prisma.invitation.findUnique({ where: { token } });
          if (
            !inv ||
            inv.status !== "PENDING" ||
            inv.expiresAt.getTime() < Date.now() ||
            inv.email.toLowerCase() !== user.email.toLowerCase()
          ) {
            throw new APIError("FORBIDDEN", {
              message: "This invitation link is invalid, expired, or does not match this email.",
            });
          }
          return { data: user };
        },
        after: async (user) => {
          // Materialize the SPECIFIC invitation identified by the token —
          // not "any pending invite by email". This is the fix for the
          // multi-invite tie-break bug.
          try {
            const token = currentInvitationToken();
            const inv = token
              ? await prisma.invitation.findUnique({ where: { token } })
              : null;
            if (inv && inv.email.toLowerCase() === user.email.toLowerCase()) {
              await acceptInvitationForUser({ invitationId: inv.id, userId: user.id });
            } else {
              // Defensive fallback for any signup path that somehow bypasses
              // the action (shouldn't be reachable post-fix, but absorbed
              // here so audit can detect the anomaly).
              const fallback = await getPendingInvitationByEmail(user.email);
              if (fallback) {
                console.warn(`[auth] accepting invitation by email fallback for ${user.email}`);
                await acceptInvitationForUser({ invitationId: fallback.id, userId: user.id });
              }
            }
          } catch (err) {
            console.error("[auth] invitation acceptance failed", err);
          }

          // Welcome email — one-shot, server-enforced. The quota check
          // returns ALREADY_SENT if we've already delivered it once, so
          // accidental double-fires (HMR, retried hook) won't double-send.
          const quota = await checkAndConsumeEmailQuota({
            identifier: user.email,
            scope: "WELCOME_SENT",
          });
          if (!quota.ok) {
            console.warn(`[auth] welcome email suppressed for ${user.email}: ${quota.reason}`);
            return;
          }
          await sendWelcomeEmail({
            to: user.email,
            name: user.name ?? undefined,
          });
        },
      },
    },
  },

  // Defense-in-depth: enforce verification lockout on any direct hit to
  // `/api/auth/email-otp/verify-email`, even ones that bypass our UI.
  // The send path checks lockout inside the OTP callback below.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/email-otp/verify-email") return;
      const email = (ctx.body as { email?: string })?.email;
      if (!email) return;
      const { locked, retryAfterSeconds } = await isVerificationLocked(email);
      if (locked) {
        throw new APIError("TOO_MANY_REQUESTS", {
          message: `Too many incorrect attempts. Try again in ${Math.ceil(
            retryAfterSeconds / 60
          )} minutes.`,
        });
      }
    }),
  },

  advanced: {
    cookiePrefix: "dtb",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      allowedAttempts: 5,
      sendVerificationOnSignUp: false,
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "email-verification") {
          // Other OTP types (sign-in, forget-password, change-email) aren't
          // wired up in the UI; degrade gracefully without sending.
          console.warn(`[auth] unhandled OTP type "${type}" for ${email}`);
          return;
        }
        // Block while locked out from too many failures.
        const lock = await isVerificationLocked(email);
        if (lock.locked) {
          throw new APIError("TOO_MANY_REQUESTS", {
            message: `Too many incorrect attempts. Try again in ${Math.ceil(
              lock.retryAfterSeconds / 60
            )} minutes.`,
          });
        }
        // Send-rate quota: 5/hour, 30s cooldown.
        const quota = await checkAndConsumeEmailQuota({
          identifier: email,
          scope: "VERIFICATION_OTP_SENT",
        });
        if (!quota.ok) {
          throw new APIError("TOO_MANY_REQUESTS", { message: quota.message });
        }
        await sendVerificationCodeEmail({ to: email, code: otp });
      },
    }),
    nextCookies(),
  ],
});

export type Auth = typeof auth;
