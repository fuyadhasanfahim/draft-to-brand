import type { Metadata } from 'next';
import Link from 'next/link';
import { IconPencilPlus } from '@tabler/icons-react';
import { requireAdmin } from '@/lib/auth/dal';
import { PageHeader } from '@/components/admin/page-header';

export const metadata: Metadata = {
    title: 'Blogs',
    robots: { index: false, follow: false },
};

export default async function AdminBlogsPage() {
    await requireAdmin();

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                eyebrow="Content"
                title="Blog posts"
                description="Write, publish, and manage the articles that carry your ads."
                actions={
                    <Link href="/admin/blogs/new" className="btn-primary">
                        <IconPencilPlus size={16} stroke={2} />
                        New post
                    </Link>
                }
            />

            <div className="glass-card rounded-3xl px-6 py-16 text-center">
                <p className="text-display text-lg font-medium">No posts yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                    The post list and editor arrive in the next phase.
                </p>
            </div>
        </div>
    );
}
