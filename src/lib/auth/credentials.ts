import { timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

/**
 * A real (but throwaway) bcrypt hash. When the submitted email does not match
 * the admin email we still run a full bcrypt comparison against this hash so the
 * response time does not reveal whether the email was correct.
 */
const DUMMY_HASH =
    '$2b$12$Cols7UG.QgKB1Ep0XBBZ9uUPdGdIexl4niXIp8mnPgYNS2A060AXC';

/**
 * The hash is stored base64-encoded in env files so its "$" characters survive
 * dotenv parsing. A raw "$2b$…" hash (e.g. set directly in a hosting dashboard,
 * where no expansion happens) is also accepted.
 */
function readAdminHash(): string | undefined {
    const raw = process.env.ADMIN_PASSWORD_HASH?.trim();
    if (!raw) return undefined;

    if (raw.startsWith('$2')) return raw;

    try {
        const decoded = Buffer.from(raw, 'base64').toString('utf8');
        if (decoded.startsWith('$2')) return decoded;
    } catch {
        // fall through
    }
    return undefined;
}

function constantTimeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies a login attempt against the single admin credential held in env vars.
 * Throws only when the server is misconfigured (missing env). Returns false for
 * any bad email/password.
 */
export async function verifyCredentials(
    email: string,
    password: string,
): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminHash = readAdminHash();

    if (!adminEmail || !adminHash) {
        throw new Error(
            'ADMIN_EMAIL and ADMIN_PASSWORD_HASH must both be set. Generate the hash with `node scripts/hash-password.mjs`.',
        );
    }

    const emailMatches = constantTimeEquals(email, adminEmail);
    const passwordMatches = await bcrypt.compare(
        password,
        emailMatches ? adminHash : DUMMY_HASH,
    );

    return emailMatches && passwordMatches;
}
