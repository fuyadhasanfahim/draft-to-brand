import { redirect } from "next/navigation";
import { getActiveMember, getAuthUser } from "@/lib/auth/session";
import { resolveEffectivePermissions } from "@/lib/permissions";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { EmailVerificationGate } from "@/features/auth/email-verification-gate";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

  const member = await getActiveMember();
  if (!member) redirect("/onboarding");

  const perms = await resolveEffectivePermissions(user.id, member.organizationId);

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, image: user.image ?? null }}
      organizationName={member.organization.name}
      roleName={member.role.name}
      permissions={Array.from(perms)}
    >
      {/* The shell renders; if the user hasn't verified email, the gate
          covers everything with a non-dismissible modal. Server-side
          mutations independently enforce verification via
          `requireVerifiedSession`. */}
      {!user.emailVerified && (
        <EmailVerificationGate email={user.email} name={user.name} />
      )}
      {children}
    </DashboardShell>
  );
}
