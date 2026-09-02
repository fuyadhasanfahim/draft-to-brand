import { cache } from 'react';
import { redirect } from 'next/navigation';
import { readSession, type SessionPayload } from './session';

/**
 * Data access layer for auth. Every protected Server Component, Server Action,
 * and Route Handler must call one of these — Proxy is only an optimistic
 * pre-filter and is not a substitute for checking here.
 */

/** Returns the current admin session, or null. Memoized per request. */
export const getCurrentAdmin = cache(async (): Promise<SessionPayload | null> => {
    return readSession();
});

/** For Server Components / Server Actions: redirect to /login when unauthenticated. */
export async function requireAdmin(): Promise<SessionPayload> {
    const admin = await getCurrentAdmin();
    if (!admin) redirect('/login');
    return admin;
}
