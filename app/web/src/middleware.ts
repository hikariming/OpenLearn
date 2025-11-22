import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    console.log(`[Middleware] Processing: ${pathname}`);

    // Define protected routes (regex to match /en/dashboard, /zh/dashboard, etc.)
    // We want to protect /dashboard and any subpaths within any locale
    const isProtectedRoute = /\/(en|zh|ja)\/dashboard/.test(pathname);

    // Define auth routes
    const isAuthRoute = /\/(en|zh|ja)\/(login|register)/.test(pathname);

    if (isProtectedRoute && !token) {
        console.log(`[Middleware] Redirecting unauthed to login`);
        // Redirect to login (preserving locale)
        const locale = pathname.split('/')[1];
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    if (isAuthRoute && token) {
        console.log(`[Middleware] Redirecting authed to dashboard`);
        // Redirect to dashboard (preserving locale)
        const locale = pathname.split('/')[1];
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    console.log(`[Middleware] Passing to intlMiddleware`);
    const response = intlMiddleware(request);
    console.log(`[Middleware] Intl response status: ${response.status}`);
    if (response.headers.get('Location')) {
        console.log(`[Middleware] Redirecting to: ${response.headers.get('Location')}`);
    }
    return response;
}

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(zh|en|ja)/:path*']
};

