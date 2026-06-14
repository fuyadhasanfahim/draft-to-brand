import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Optimistic auth gate ONLY. We look at the Better Auth session cookie's
 * existence — NOT its validity. Real authorization happens in:
 *   - The (dashboard) layout (`getAuthUser` + `getActiveMember`)
 *   - Server Actions / Route Handlers (`requireSession`, `can()`)
 *
 * Per Next 16 docs: Proxy must not be used as a full auth solution.
 */

const PROTECTED_PREFIX = '/dashboard';
// Auth-facing routes. If the user has a session cookie, /sign-in and /sign-up
// bounce to /dashboard — but /no-workspace MUST be reachable while signed in
// (it's the destination for "authenticated but no membership"), so it's
// excluded from the bounce list.
const AUTH_ROUTES = ['/sign-in', '/sign-up'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const hasSession = request.cookies
        .getAll()
        .some((cookie) => cookie.name.includes('session_token'));

    if (pathname.startsWith(PROTECTED_PREFIX) && !hasSession) {
        const url = request.nextUrl.clone();
        url.pathname = '/sign-in';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
    }

    if (AUTH_ROUTES.includes(pathname) && hasSession) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.search = '';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/sign-in', '/sign-up'],
};
