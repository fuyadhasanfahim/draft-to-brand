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
        <main className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
                <h1 className="text-lg font-semibold">Admin sign in</h1>
                <p className="mt-1 mb-6 text-sm text-neutral-500">
                    Restricted area. Authorized users only.
                </p>
                <LoginForm />
            </div>
        </main>
    );
}
