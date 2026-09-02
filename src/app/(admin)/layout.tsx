import type { Metadata } from 'next';

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

/**
 * Bare shell for the admin area — no marketing nav/footer, not indexable.
 * The full dashboard chrome (sidebar, providers) is added in a later phase.
 */
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 text-foreground">{children}</div>
    );
}
