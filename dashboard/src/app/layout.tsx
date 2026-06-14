import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';
import { BRAND } from '@/lib/constants/brand';
import './globals.css';

const display = Inter({
    variable: '--font-display',
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: { default: BRAND.name, template: `%s · ${BRAND.name}` },
    description: BRAND.description,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${display.variable} h-full antialiased`}>
            <body className="min-h-full bg-[var(--color-background)] text-[var(--color-foreground)]">
                <ToastProvider>{children}</ToastProvider>
            </body>
        </html>
    );
}
