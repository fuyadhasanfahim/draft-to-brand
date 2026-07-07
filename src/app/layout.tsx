import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/lib/site';
import { Analytics } from '@/components/shared/analytics';
import { PixelPageView } from '@/components/shared/pixel-pageview';

const display = Inter({
    variable: '--font-display',
    subsets: ['latin'],
    display: 'swap',
});

const serif = Instrument_Serif({
    variable: '--font-serif',
    subsets: ['latin'],
    weight: '400',
    style: ['normal', 'italic'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: `${siteConfig.name} | ${siteConfig.tagline}`,
        template: `%s · ${siteConfig.name}`,
    },
    description: siteConfig.description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: '/' },
    icons: {
        icon: siteConfig.ogImage,
        apple: siteConfig.ogImage,
    },
    openGraph: {
        title: `${siteConfig.name} | ${siteConfig.tagline}`,
        description: siteConfig.description,
        url: siteConfig.url,
        siteName: siteConfig.name,
        type: 'website',
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: `${siteConfig.name} | ${siteConfig.tagline}`,
        description: siteConfig.description,
        images: [siteConfig.ogImage],
    },
};

const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: siteConfig.ogImage,
    description: siteConfig.description,
    email: siteConfig.email,
    sameAs: [
        siteConfig.socials.instagram,
        siteConfig.socials.linkedin,
        siteConfig.socials.x,
    ],
};

export const viewport = {
    themeColor: '#ffffff',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={`${display.variable} ${serif.variable} h-full antialiased`}
        >
            <body className="min-h-full overflow-x-hidden bg-background text-foreground">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(organizationJsonLd).replace(
                            /</g,
                            '\\u003c',
                        ),
                    }}
                />
                {children}
                <Suspense fallback={null}>
                    <PixelPageView />
                </Suspense>
                <Analytics />
            </body>
        </html>
    );
}
