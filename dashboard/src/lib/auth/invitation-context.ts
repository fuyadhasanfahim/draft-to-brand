import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request channel that carries the invitation token from the public-facing
 * `acceptInvitationAction` into Better Auth's `databaseHooks.user.create.*`.
 *
 * Why ALS, not headers: Better Auth's internal `auth.api.signUpEmail` call
 * goes through its own request runtime, so headers we set in our action are
 * not visible inside the hook. ALS survives the async hop because we wrap
 * the BA call with `run()`.
 *
 * Why ALS, not a DB lookup-by-email: the auditable bug we are closing is
 * "two pending invitations for the same email → arbitrary one accepted".
 * The token is the secret that identifies WHICH invitation the user
 * actually clicked on; nothing else does.
 */

export type InvitationToken = { token: string };

export const invitationTokenStore = new AsyncLocalStorage<InvitationToken>();

export function withInvitationToken<T>(token: string, fn: () => Promise<T>): Promise<T> {
  return invitationTokenStore.run({ token }, fn);
}

export function currentInvitationToken(): string | null {
  return invitationTokenStore.getStore()?.token ?? null;
}
