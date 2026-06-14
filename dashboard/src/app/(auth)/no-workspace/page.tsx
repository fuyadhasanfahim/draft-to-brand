import { redirect } from "next/navigation";
import { IconMailbox } from "@tabler/icons-react";
import { getActiveMember, getAuthUser } from "@/lib/auth/session";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { BRAND } from "@/lib/constants/brand";

export const metadata = { title: "No workspace" };

export default async function NoWorkspacePage() {
  const user = await getAuthUser();

  // Not signed in → send to sign-in. Avoids any cross-talk if someone
  // hits this URL directly.
  if (!user) redirect("/sign-in");

  // If they DO have a membership now (e.g. an admin just invited them),
  // let them in. This page is a dead-end only for the legitimate "no
  // workspace" state.
  const member = await getActiveMember();
  if (member) redirect("/dashboard");

  return (
    <div>
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
        <IconMailbox size={20} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        You&rsquo;re signed in — but no workspace yet
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        Your {BRAND.name} account exists, but you haven&rsquo;t been added to a
        workspace. Ask your administrator to invite{" "}
        <span className="font-medium text-[var(--color-foreground)]">{user.email}</span> to
        the team. Once you&rsquo;re invited, refresh this page.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <SignOutButton>Sign out</SignOutButton>
      </div>
    </div>
  );
}
