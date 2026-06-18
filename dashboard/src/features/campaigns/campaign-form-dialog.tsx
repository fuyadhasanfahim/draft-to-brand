"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  Input,
  Modal,
  Textarea,
  useToast,
} from "@/components/ui";
import { updateCampaignAction } from "@/actions/campaigns";
import { campaignSchema, type CampaignFormValues } from "@/lib/validators/campaigns";

/**
 * Edit-only campaign content dialog. Creation lives on /dashboard/campaigns/new
 * (it needs recipient selection), mirroring the Leads pattern. Status changes
 * happen via the detail page's lifecycle controls, not here.
 */
export type CampaignEditable = {
  id: string;
  name: string;
  subject: string;
  body: string;
  fromName: string | null;
  replyTo: string | null;
};

export function CampaignFormDialog({
  open,
  onOpenChange,
  campaign,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign: CampaignEditable;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const defaults: CampaignFormValues = {
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    body: campaign.body,
    fromName: campaign.fromName ?? "",
    replyTo: campaign.replyTo ?? "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id]);

  const onSubmit = async (values: CampaignFormValues) => {
    const res = await updateCampaignAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Campaign updated" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${campaign.name}`}
      description="Update the campaign content. Recipients are managed from the Recipients tab."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save changes
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
          <Textarea rows={10} {...register("body")} />
        </Field>
      </form>
    </Modal>
  );
}
