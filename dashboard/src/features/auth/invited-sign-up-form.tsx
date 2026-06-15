"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { acceptInvitationAction } from "@/actions/accept-invitation";
import { Button, Field, Input, useToast } from "@/components/ui";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});
type FormInput = z.infer<typeof schema>;

export function InvitedSignUpForm({
  token,
  email,
  organizationName,
  roleName,
}: {
  /** Validated server-side before render — passed through to the action verbatim. */
  token: string;
  email: string;
  organizationName: string;
  roleName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormInput) => {
    // Signup now goes through our server action so the token can be
    // surfaced to Better Auth's hooks via AsyncLocalStorage.
    // authClient.signUp.email is deliberately NOT called from here.
    const result = await acceptInvitationAction({
      token,
      name: values.name,
      password: values.password,
    });
    if (!result.ok) {
      toast({
        variant: "error",
        title: "Couldn't create account",
        description: result.error,
      });
      return;
    }
    toast({ variant: "success", title: "Welcome to the team" });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-3 text-[13px]">
        <p className="text-[var(--color-muted-foreground)]">
          You&rsquo;re joining{" "}
          <span className="font-medium text-[var(--color-foreground)]">{organizationName}</span> as{" "}
          <span className="font-medium text-[var(--color-foreground)]">{roleName}</span>.
        </p>
        <p className="mt-1 text-[var(--color-muted)]">{email}</p>
      </div>

      <Field label="Full name" required error={errors.name?.message}>
        <Input autoComplete="name" autoFocus {...register("name")} />
      </Field>

      <Field
        label="Password"
        required
        hint="At least 8 characters"
        error={errors.password?.message}
      >
        <Input type="password" autoComplete="new-password" {...register("password")} />
      </Field>

      <Button type="submit" variant="accent" loading={isSubmitting}>
        Accept invitation
      </Button>
    </form>
  );
}
