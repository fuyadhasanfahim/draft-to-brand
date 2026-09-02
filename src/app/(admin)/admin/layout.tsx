import { requireAdmin } from '@/lib/auth/dal';
import { AdminShell } from '@/components/admin/admin-shell';

/** Auth gate + dashboard chrome for everything under /admin. */
export default async function AdminAreaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const admin = await requireAdmin();
    return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
