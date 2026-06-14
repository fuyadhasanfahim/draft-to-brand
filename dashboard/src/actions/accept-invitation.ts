"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/server";
import {
  getValidInvitationByToken,
} from "@/lib/auth/invitations";
import { withInvitationToken } from "@/lib/auth/invitation-context";

const schema = z.object({
  token: z.string().min(8, "Missing invitation token"),
  name: z.string().min(2, "Enter your full name").max(120),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type AcceptInvitationInput = z.infer<typeof schema>;
export type AcceptInvitationResult = { ok: true } | { ok: false; error: string };

/**
 * Token-anchored signup. The ONLY path that creates a user under the new
 * invitation-only regime. Validates the token (server side) before delegating
 * to Better Auth, then surfaces the token to the BA hooks via
 * `withInvitationToken(token, fn)` so the hooks accept this exact invitation
 * (not "any by email").
 *
 * Critical #4 close-out:
 *   - Tokens are now load-bearing — the BA `before` hook refuses signup if
 *     no token is in the ALS context.
 *   - The invitation accepted at the end is the one bound to the token, even
 *     if the recipient happens to have other pending invites for the same email.
 */
export async function acceptInvitationAction(
  input: AcceptInvitationInput
): Promise<AcceptInvitationResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { token, name, password } = parsed.data;

  // Pre-flight validation so we can surface a friendly error before BA runs.
  const invitation = await getValidInvitationByToken(token);
  if (!invitation) {
    return {
      ok: false,
      error: "This invitation link is invalid, expired, or has already been used.",
    };
  }

  try {
    await withInvitationToken(token, () =>
      auth.api.signUpEmail({
        body: { email: invitation.email, name, password },
      })
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign-up failed";
    return { ok: false, error: message };
  }
}
