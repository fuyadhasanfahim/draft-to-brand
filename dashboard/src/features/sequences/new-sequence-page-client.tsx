"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button, Field, Input, Textarea, useToast } from "@/components/ui";
import { createSequenceAction } from "@/actions/sequences";
import { sequenceSchema, type SequenceFormValues } from "@/lib/validators/sequences";

export function NewSequencePageClient() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SequenceFormValues>({
    resolver: zodResolver(sequenceSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = async (values: SequenceFormValues) => {
    const res = await createSequenceAction(values);
    if (!res.ok || !res.id) {
      toast({ variant: "error", title: "Couldn't create sequence", description: res.ok ? "" : res.error });
      return;
    }
    toast({ variant: "success", title: "Sequence created" });
    router.push(`/dashboard/sequences/${res.id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/sequences"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Sequences
        </Link>
        <h1 className="text-display text-2xl text-[var(--color-foreground)]">New sequence</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          Name your followup sequence. Add the followup steps (timing + condition)
          on the next screen, then attach it to a campaign.
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <section className="surface-card flex flex-col gap-4 p-5">
          <Field label="Sequence name" required error={errors.name?.message}>
            <Input autoFocus {...register("name")} placeholder="Cold outreach — 3 touch" />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <Textarea
              rows={3}
              {...register("description")}
              placeholder="Optional — what this sequence is for."
            />
          </Field>
        </section>

        <div className="flex items-center justify-end gap-2">
          <Link href="/dashboard/sequences">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Create sequence
          </Button>
        </div>
      </form>
    </div>
  );
}
