"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBrandGoogle } from "@tabler/icons-react";
import { authClient } from "@/lib/auth/client";
import { signInSchema, type SignInInput } from "@/lib/validators/auth";
import { Button, Field, Input, useToast } from "@/components/ui";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const redirectTo = params.get("redirect") ?? "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) });

  const onSubmit = async (values: SignInInput) => {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      callbackURL: redirectTo,
    });
    if (error) {
      toast({ variant: "error", title: "Sign-in failed", description: error.message });
      return;
    }
    router.push(redirectTo);
    router.refresh();
  };

  const signInGoogle = () =>
    authClient.signIn.social({ provider: "google", callbackURL: redirectTo });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      <Button type="submit" loading={isSubmitting}>Sign in</Button>

      <div className="my-2 flex items-center gap-3 text-xs text-[var(--color-muted)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        OR
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <Button type="button" variant="secondary" onClick={signInGoogle}>
        <IconBrandGoogle size={16} /> Continue with Google
      </Button>
    </form>
  );
}
