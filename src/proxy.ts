import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/jwt';

/**
 * Optimistic auth pre-filter for the admin area. This only reads and verifies
 * the session cookie — the real authorization checks live in the Data Access
 * Layer (`@/lib/auth/dal`) and are enforced inside every admin page, Server
 * Action, and API route.
 */
export async function proxy(request: NextRequest) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(token);

    if (!session) {
        const loginUrl = new URL('/login', request.url);
        if (request.nextUrl.pathname !== '/admin') {
            loginUrl.searchParams.set('next', request.nextUrl.pathname);
        }
        const response = NextResponse.redirect(loginUrl);
        // Drop a stale/invalid cookie so the browser stops sending it.
        if (token) response.cookies.delete(SESSION_COOKIE);
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
