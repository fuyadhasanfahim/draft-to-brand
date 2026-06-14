import { redirect } from "next/navigation";
import { getActiveMember, getAuthUser } from "@/lib/auth/session";
import { resolveEffectivePermissions } from "@/lib/permissions";
import { DashboardShell } from "@/components/layouts/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  // Not authenticated — send to sign-in. Proxy lets /sign-in render
  // because the next request will be a fresh navigation, not a redirect
  // chain from /dashboard.
  if (!user) redirect("/sign-in");

  const member = await getActiveMember();
  // Authenticated, but no workspace — this is its own state, not an
  // auth failure. Routing to /sign-in here is what caused the 307 loop
  // (proxy sees the session cookie and bounces back to /dashboard).
  if (!member) redirect("/no-workspace");

  const perms = await resolveEffectivePermissions(user.id, member.organizationId);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, image: user.image ?? null }}
      organizationName={member.organization.name}
      roleName={member.role.name}
      permissions={Array.from(perms)}
    >
      {children}
    </DashboardShell>
  );
}
