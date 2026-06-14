import { redirect } from "next/navigation";
import { getActiveMember, getAuthUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui";
import { CreateWorkspaceForm } from "@/features/onboarding/create-workspace-form";

export const metadata = { title: "Create your workspace" };

export default async function OnboardingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

  // If the user already belongs to a workspace, onboarding is a no-op —
  // never let them re-enter it (would create a second org).
  const member = await getActiveMember();
  if (member) redirect("/dashboard");

  return (
    <div>
      <Badge variant="primary">Step 1 of 1</Badge>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Create your workspace
      </h1>
      <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
        Name your agency&rsquo;s workspace. We&rsquo;ll set up a default branch,
        department, and team so you can invite your people right away.
      </p>

      <div className="mt-7">
        <CreateWorkspaceForm />
      </div>

      <p className="mt-6 text-xs text-[var(--color-muted)]">
        Signed in as <span className="text-[var(--color-foreground)]">{user.email}</span>.
        You&rsquo;ll become the <strong>Owner</strong> of this workspace.
      </p>
    </div>
  );
}
