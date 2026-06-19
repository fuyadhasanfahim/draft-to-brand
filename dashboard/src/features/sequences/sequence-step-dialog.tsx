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
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { upsertSequenceStepAction } from "@/actions/sequences";
import {
  sequenceStepSchema,
  STEP_CONDITIONS,
  type SequenceStepFormValues,
} from "@/lib/validators/sequences";
import { CONDITION_LABELS } from "@/lib/email/sequence-conditions";

export type StepEditable = {
  id: string;
  delayDays: number;
  subject: string;
  body: string;
  condition: SequenceStepFormValues["condition"];
};

export function SequenceStepDialog({
  open,
  onOpenChange,
  sequenceId,
  step,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sequenceId: string;
  /** Present when editing an existing step. */
  step?: StepEditable;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(step);

  const defaults: SequenceStepFormValues = step
    ? {
        id: step.id,
        sequenceId,
        delayDays: step.delayDays,
        subject: step.subject,
        body: step.body,
        condition: step.condition,
      }
    : {
        sequenceId,
        delayDays: 3,
        subject: "",
        body: "",
        condition: "ALWAYS",
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SequenceStepFormValues>({
    resolver: zodResolver(sequenceStepSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, sequenceId]);

  const onSubmit = async (values: SequenceStepFormValues) => {
    const res = await upsertSequenceStepAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save step", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Step updated" : "Step added" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit step" : "Add step"}
      description="A followup sent N days after the campaign send, only if the condition holds."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? "Save step" : "Add step"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Delay (days after send)"
            required
            hint="0 = immediately, 3 = three days later…"
            error={errors.delayDays?.message}
          >
            <Input
              type="number"
              min={0}
              max={365}
              value={watch("delayDays") ?? 0}
              onChange={(e) =>
                setValue("delayDays", e.target.value === "" ? 0 : Number(e.target.value))
              }
            />
          </Field>
          <Field label="Condition" required error={errors.condition?.message}>
            <Select
              value={watch("condition")}
              onChange={(e) =>
                setValue("condition", e.target.value as SequenceStepFormValues["condition"])
              }
            >
              {STEP_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {CONDITION_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Subject" required error={errors.subject?.message}>
          <Input {...register("subject")} placeholder="Re: quick question" />
        </Field>
        <Field
          label="Email body"
          required
          hint="Plain text. Links are tracked and an open pixel is added automatically."
          error={errors.body?.message}
        >
          <Textarea rows={8} {...register("body")} placeholder="Just following up…" />
        </Field>
      </form>
    </Modal>
  );
}
