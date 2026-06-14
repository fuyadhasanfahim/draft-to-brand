import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { prisma } from "@/lib/db";
import { getValidInvitationByToken } from "@/lib/auth/invitations";
import { InvitedSignUpForm } from "@/features/auth/invited-sign-up-form";
import { Button } from "@/components/ui";

export const metadata = { title: "Sign up" };

type Props = {
  // Next 16: route segment props are async — searchParams must be awaited.
  searchParams: Promise<{ token?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const invitation = await getValidInvitationByToken(token);

  if (!invitation) {
    return (
      <div>
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted-foreground)]">
          <IconLock size={20} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
          Invitation required
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          Sign-up is invitation-only. {token
            ? "This invitation link is invalid, expired, or has already been used."
            : "You need an invitation from an administrator to create an account."}
        </p>
        <div className="mt-6">
          <Link href="/sign-in">
            <Button variant="secondary">Back to sign-in</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Best-effort enrichment for the form panel — never leaks anything the
  // recipient can't already see from their inbox.
  const org = await prisma.organization.findUnique({
    where: { id: invitation.organizationId },
    select: { name: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Accept your invitation
      </h1>
      <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)]">
        Finish setting up your account.
      </p>
      <div className="mt-7">
        <InvitedSignUpForm
          token={invitation.token}
          email={invitation.email}
          organizationName={org?.name ?? "your workspace"}
          roleName={invitation.role.name}
        />
      </div>
      <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-[var(--color-primary)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
