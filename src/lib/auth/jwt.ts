import { SignJWT, jwtVerify } from 'jose';

/**
 * Pure JWT sign/verify for the admin session. No `next/headers` import here so
 * this module is safe to use from `proxy.ts` (which cannot touch the cookie
 * store). Cookie handling lives in `./session`.
 */

export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const ALG = 'HS256';

export type SessionPayload = {
    /** Stable identifier for the single admin — their email. */
    sub: string;
    email: string;
    name: string;
};

function encodedKey(): Uint8Array {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error(
            'AUTH_SECRET is missing or too short. Set it to a random string of at least 32 characters.',
        );
    }
    return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
    return new SignJWT({ email: payload.email, name: payload.name })
        .setProtectedHeader({ alg: ALG })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setNotBefore(0)
        .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
        .sign(encodedKey());
}

export async function verifySession(
    token: string | undefined | null,
): Promise<SessionPayload | null> {
    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, encodedKey(), {
            algorithms: [ALG],
        });

        if (
            typeof payload.sub === 'string' &&
            typeof payload.email === 'string' &&
            typeof payload.name === 'string'
        ) {
            return { sub: payload.sub, email: payload.email, name: payload.name };
        }
        return null;
    } catch {
        // Expired, tampered, wrong secret, or malformed — all treated as "no session".
        return null;
    }
}
