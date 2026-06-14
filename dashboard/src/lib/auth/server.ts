import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "./emails";
import { provisionMemberForNewUser } from "./provision";

/**
 * Better Auth is the authentication layer ONLY.
 * Business identity (Member, Role, Permission) lives separately in the agency schema.
 * Do not add agency-level fields to the User additionalFields here.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Better Auth invokes this for the "forgot password" flow.
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? undefined,
        resetUrl: url,
      });
    },
  },

  emailVerification: {
    // Send verification on every sign-up automatically.
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name ?? undefined,
        verifyUrl: url,
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // refresh once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,             // 5 minutes — keeps proxy.ts checks cheap
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Fire a welcome email once the user record actually lands in the DB.
        // Best-effort — never blocks account creation.
        after: async (user) => {
          // Provision FIRST — the dashboard depends on Member existing.
          // Errors here must not block account creation, but should surface.
          try {
            await provisionMemberForNewUser(user.id);
          } catch (err) {
            console.error("[auth] member provisioning failed", err);
          }
          await sendWelcomeEmail({
            to: user.email,
            name: user.name ?? undefined,
          });
        },
      },
    },
  },

  advanced: {
    cookiePrefix: "dtb",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  // nextCookies MUST be last — it handles setting cookies in Server Actions.
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
