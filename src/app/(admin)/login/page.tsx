import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/dal';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
    title: 'Admin Login',
    robots: { index: false, follow: false },
};

export default async function LoginPage() {
    if (await getCurrentAdmin()) {
        redirect('/admin/blogs');
    }

    return (
        <main className="grid min-h-screen place-items-center bg-surface px-4">
            <div className="w-full max-w-sm">
                <div className="glass-card rounded-3xl p-8">
                    <span className="section-eyebrow">Draft To Brand</span>
                    <h1 className="text-display mt-4 text-xl font-medium tracking-tight">
                        Admin sign in
                    </h1>
                    <p className="mt-1 mb-6 text-sm text-muted">
                        Restricted area — authorized users only.
                    </p>
                    <LoginForm />
                </div>
            </div>
        </main>
    );
}
