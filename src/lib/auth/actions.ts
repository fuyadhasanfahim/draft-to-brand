'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { loginSchema } from './schema';
import { verifyCredentials } from './credentials';
import { createSession, destroySession } from './session';
import { checkRateLimit, recordFailure, clearAttempts } from './rate-limit';

export type LoginState = { error?: string };

async function clientId(): Promise<string> {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || h.get('x-real-ip')?.trim() || 'unknown';
}

export async function login(input: unknown): Promise<LoginState> {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Enter a valid email and password.' };
    }

    const id = await clientId();
    const limit = checkRateLimit(id);
    if (!limit.ok) {
        return {
            error: `Too many attempts. Try again in about ${Math.ceil(limit.retryAfterSec / 60)} minute(s).`,
        };
    }

    const email = parsed.data.email.trim().toLowerCase();

    let ok = false;
    try {
        ok = await verifyCredentials(email, parsed.data.password);
    } catch (error) {
        console.error('Admin auth is misconfigured:', error);
        return { error: 'Login is not configured yet. Contact the site owner.' };
    }

    if (!ok) {
        recordFailure(id);
        return { error: 'Invalid email or password.' };
    }

    clearAttempts(id);
    await createSession({
        sub: email,
        email,
        name: process.env.ADMIN_NAME?.trim() || 'Admin',
    });

    redirect('/admin/blogs');
}

export async function logout(): Promise<void> {
    await destroySession();
    redirect('/login');
}
