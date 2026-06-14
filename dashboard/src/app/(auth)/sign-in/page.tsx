import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Sign in to your workspace.
      </p>
      <div className="mt-8">
        <Suspense>
          <SignInForm />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-[var(--color-muted-foreground)]">
        New here?{" "}
        <Link href="/sign-up" className="text-[var(--color-primary)] font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
