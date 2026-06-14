import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { resolveEffectivePermissions } from "@/lib/permissions";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/sign-in");

  const perms = await resolveEffectivePermissions(
    session.user.id,
    session.member.organizationId
  );

  return (
    <DashboardShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      organizationName={session.member.organization.name}
      roleName={session.member.role.name}
      permissions={Array.from(perms)}
    >
      {children}
    </DashboardShell>
  );
}
