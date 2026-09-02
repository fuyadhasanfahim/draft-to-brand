import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/dal';
import { logout } from '@/lib/auth/actions';

export const metadata: Metadata = {
    title: 'Blogs',
    robots: { index: false, follow: false },
};

export default async function AdminBlogsPage() {
    const admin = await requireAdmin();

    return (
        <main className="mx-auto max-w-3xl px-6 py-16">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Blogs</h1>
                <form action={logout}>
                    <button
                        type="submit"
                        className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5"
                    >
                        Sign out
                    </button>
                </form>
            </div>
            <p className="mt-4 text-sm text-neutral-600">
                Signed in as <strong>{admin.name}</strong> ({admin.email}).
            </p>
            <p className="mt-2 text-sm text-neutral-500">
                The blog dashboard is built in a later phase. Auth is live.
            </p>
        </main>
    );
}
