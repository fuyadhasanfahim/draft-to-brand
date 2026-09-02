import type { Metadata } from 'next';
import { AdminProviders } from '@/components/admin/providers';

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

/**
 * Wraps the whole admin area (login + dashboard) in client providers
 * (react-query, toasts). The dashboard chrome is added one level down in
 * `admin/layout.tsx` so `/login` stays bare.
 */
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminProviders>{children}</AdminProviders>;
}
