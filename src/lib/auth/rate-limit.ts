/**
 * Best-effort in-memory rate limiter for login attempts, keyed by client IP.
 *
 * This resets on every cold start and is per-instance, so it is not a hard
 * guarantee under horizontal scaling — it exists to blunt online brute-force
 * from a single source. For a strict limit, back this with Redis/Upstash.
 */

type Entry = { count: number; windowStart: number; blockedUntil: number };

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 15 * 60 * 1000; // lock for 15 minutes after MAX_ATTEMPTS

const store = new Map<string, Entry>();

// Opportunistic cleanup so the map cannot grow without bound.
function sweep(now: number): void {
    if (store.size < 500) return;
    for (const [key, entry] of store) {
        if (entry.blockedUntil < now && now - entry.windowStart > WINDOW_MS) {
            store.delete(key);
        }
    }
}

export function checkRateLimit(id: string): { ok: boolean; retryAfterSec: number } {
    const now = Date.now();
    const entry = store.get(id);

    if (entry && entry.blockedUntil > now) {
        return { ok: false, retryAfterSec: Math.ceil((entry.blockedUntil - now) / 1000) };
    }
    return { ok: true, retryAfterSec: 0 };
}

export function recordFailure(id: string): void {
    const now = Date.now();
    sweep(now);

    const entry = store.get(id);
    if (!entry || now - entry.windowStart > WINDOW_MS) {
        store.set(id, { count: 1, windowStart: now, blockedUntil: 0 });
        return;
    }

    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
        entry.blockedUntil = now + BLOCK_MS;
        entry.count = 0;
        entry.windowStart = now;
    }
}

export function clearAttempts(id: string): void {
    store.delete(id);
}
