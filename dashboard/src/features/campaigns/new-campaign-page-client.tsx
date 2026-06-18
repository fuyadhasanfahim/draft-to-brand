"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconChevronLeft } from "@tabler/icons-react";
import {
  Button,
  Field,
  Input,
  Textarea,
  useToast,
} from "@/components/ui";
import { createCampaignAction, addRecipientsAction } from "@/actions/campaigns";
import { campaignSchema, type CampaignFormValues } from "@/lib/validators/campaigns";
import {
  RecipientSelector,
  type ContactOption,
  type LeadOption,
  type RecipientSelection,
} from "./recipient-selector";

export function NewCampaignPageClient({
  contacts,
  leads,
}: {
  contacts: ContactOption[];
  leads: LeadOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: "", subject: "", body: "", fromName: "", replyTo: "" },
  });

  const [selection, setSelection] = React.useState<RecipientSelection>({
    contactIds: [],
    leadIds: [],
  });

  const onSubmit = async (values: CampaignFormValues) => {
    const res = await createCampaignAction(values);
    if (!res.ok || !res.id) {
      toast({ variant: "error", title: "Couldn't create campaign", description: res.ok ? "" : res.error });
      return;
    }
    const campaignId = res.id;

    // Attach the selected recipients (best-effort — the campaign already
    // exists, so a recipient failure shouldn't lose the draft).
    if (selection.contactIds.length || selection.leadIds.length) {
      const addRes = await addRecipientsAction({
        campaignId,
        contactIds: selection.contactIds,
        leadIds: selection.leadIds,
      });
      if (!addRes.ok) {
        toast({
          variant: "error",
          title: "Campaign created, but recipients failed",
          description: addRes.error,
        });
      }
    }

    toast({ variant: "success", title: "Campaign created" });
    router.push(`/dashboard/campaigns/${campaignId}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Campaigns
        </Link>
        <h1 className="text-display text-2xl text-[var(--color-foreground)]">New campaign</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
          Draft a cold email and choose who receives it. Sending and tracking
          land in a later phase — this creates the campaign and its recipient
          list.
        </p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <section className="surface-card flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
            Content
          </h2>
          <Field label="Campaign name" required error={errors.name?.message}>
            <Input autoFocus {...register("name")} placeholder="Q3 outbound — agencies" />
          </Field>
          <Field label="Subject" required error={errors.subject?.message}>
            <Input {...register("subject")} placeholder="Quick question about your team" />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="From name"
              hint="Display name on the email. Blank uses the workspace default."
              error={errors.fromName?.message}
            >
              <Input {...register("fromName")} placeholder="Fuyad Hasan" />
            </Field>
            <Field
              label="Reply-to"
              hint="Where replies go. Blank uses the workspace default."
              error={errors.replyTo?.message}
            >
              <Input type="email" {...register("replyTo")} placeholder="you@drafttobrand.com" />
            </Field>
          </div>
          <Field
            label="Email body"
            required
            hint="Plain text. A simple branded footer is added automatically when sent."
            error={errors.body?.message}
          >
            <Textarea rows={9} {...register("body")} placeholder="Hi there,&#10;&#10;…" />
          </Field>
        </section>

        <section className="surface-card flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-foreground)]">
              Recipients
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--color-muted-foreground)]">
              Select existing contacts and leads. You can add more later from the
              campaign page.
            </p>
          </div>
          <RecipientSelector
            contacts={contacts}
            leads={leads}
            value={selection}
            onChange={setSelection}
          />
        </section>

        <div className="flex items-center justify-end gap-2">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Create campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
