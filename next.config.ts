import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// Google AdSense (article ads on /blog). Grouped so Adsterra domains can be
// added alongside later.
const adTrafficQuality =
    'https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google';

const adsense = {
    script: `https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com https://adservice.google.com ${adTrafficQuality}`,
    img: `https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net https://www.google.com ${adTrafficQuality}`,
    connect: `https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.g.doubleclick.net ${adTrafficQuality}`,
    frame: `https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com ${adTrafficQuality}`,
};

// Adsterra serves from a rotating pool of domains — this covers the common
// ones; top up here if the browser console reports a blocked Adsterra host.
const adsterraHosts =
    'https://*.highperformanceformat.com https://*.profitablecpmrate.com https://*.profitableratecpmnetwork.com https://*.effectivecreativeformats.com https://*.effectivegatecpm.com https://*.displaycontentnetwork.com https://*.profitabledisplaynetwork.com https://*.premiumdisplaynetwork.com https://*.topcreativeformat.com https://*.creativecdn.com https://*.realsrv.com https://*.magsrv.com https://*.adsterra.com https://*.adsterranet.com https://*.terraclicks.com https://*.creative-serving.com https://*.hidhide.com';

const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://connect.facebook.net ${adsense.script} ${adsterraHosts}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https://res.cloudinary.com https://www.facebook.com https://*.google-analytics.com https://*.googletagmanager.com ${adsense.img} ${adsterraHosts}`,
    "font-src 'self' data:",
    `connect-src 'self' https://www.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://connect.facebook.net ${adsense.connect} ${adsterraHosts}`,
    `frame-src ${adsense.frame} ${adsterraHosts}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
].join('; ');

const securityHeaders = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
    },
];

const nextConfig: NextConfig = {
    /* config options here */
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
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
