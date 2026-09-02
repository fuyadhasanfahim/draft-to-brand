import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const analyticsHosts = {
    script: 'https://www.googletagmanager.com https://connect.facebook.net',
    img: 'https://www.facebook.com https://*.google-analytics.com https://*.googletagmanager.com',
    connect:
        'https://www.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://connect.facebook.net',
};

// Strict policy for the whole site EXCEPT /blog.
const strictCsp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${analyticsHosts.script}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https://res.cloudinary.com ${analyticsHosts.img}`,
    "font-src 'self' data:",
    `connect-src 'self' ${analyticsHosts.connect}`,
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
].join('; ');

// /blog runs Google AdSense + Adsterra. AdSense has a fixed host set, but
// Adsterra pulls scripts, pixels and iframes from a large pool of throwaway
// domains that rotate every few requests and cannot be allow-listed — so the
// ad-related directives fall back to `https:` here. This relaxation is scoped
// to /blog only; every other route keeps `strictCsp`.
const blogCsp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' http:" : ''} https:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https:",
    `connect-src 'self' https:${isDev ? ' http:' : ''}`,
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
].join('; ');

const baseSecurityHeaders = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
];

const nextConfig: NextConfig = {
    reactCompiler: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
        ],
        // Cloudinary URLs here are version-hashed (immutable), so cache
        // the optimized output for a year instead of the 60s default.
        minimumCacheTTL: 31536000,
    },
    async headers() {
        return [
            {
                source: '/blog/:path*',
                headers: [
                    { key: 'Content-Security-Policy', value: blogCsp },
                    ...baseSecurityHeaders,
                ],
            },
            {
                // Everything except /blog.
                source: '/((?!blog).*)',
                headers: [
                    { key: 'Content-Security-Policy', value: strictCsp },
                    ...baseSecurityHeaders,
                ],
            },
        ];
    },
};

export default nextConfig;
