import { cookies } from 'next/headers';
import {
    SESSION_COOKIE,
    SESSION_MAX_AGE_SECONDS,
    signSession,
    verifySession,
    type SessionPayload,
} from './jwt';

export type { SessionPayload };
export { SESSION_COOKIE };

/** Creates the signed session cookie. Call only from Server Actions / Route Handlers. */
export async function createSession(payload: SessionPayload): Promise<void> {
    const token = await signSession(payload);
    const store = await cookies();

    store.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_SECONDS,
    });
}

/** Clears the session cookie. */
export async function destroySession(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
}

/** Reads and verifies the session from the request cookies. */
export async function readSession(): Promise<SessionPayload | null> {
    const store = await cookies();
    return verifySession(store.get(SESSION_COOKIE)?.value);
}
