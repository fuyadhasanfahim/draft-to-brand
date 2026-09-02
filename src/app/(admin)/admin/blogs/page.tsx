import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/dal';

export const metadata: Metadata = {
    title: 'Blogs',
    robots: { index: false, follow: false },
};

export default async function AdminBlogsPage() {
    await requireAdmin();

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-display text-2xl font-medium tracking-tight sm:text-3xl">
                Blog posts
            </h1>
            <p className="mt-2 text-sm text-muted">
                The post list and editor arrive in the next phases.
            </p>
        </div>
    );
}
