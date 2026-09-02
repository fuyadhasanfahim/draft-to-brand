import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth/dal';

/** /admin has no screen of its own — send the visitor where they belong. */
export default async function AdminIndexPage() {
    const admin = await getCurrentAdmin();
    redirect(admin ? '/admin/blogs' : '/login');
}
