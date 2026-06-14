import Link from "next/link";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Join your agency workspace.
      </p>
      <div className="mt-8">
        <SignUpForm />
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
