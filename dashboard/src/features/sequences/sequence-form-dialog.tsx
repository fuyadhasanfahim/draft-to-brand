"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Input, Modal, Textarea, useToast } from "@/components/ui";
import { updateSequenceAction } from "@/actions/sequences";
import { sequenceSchema, type SequenceFormValues } from "@/lib/validators/sequences";

export type SequenceEditable = {
  id: string;
  name: string;
  description: string | null;
};

/** Edit-only dialog for a sequence's name/description (mirrors campaign edit). */
export function SequenceFormDialog({
  open,
  onOpenChange,
  sequence,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sequence: SequenceEditable;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const defaults: SequenceFormValues = {
    id: sequence.id,
    name: sequence.name,
    description: sequence.description ?? "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SequenceFormValues>({
    resolver: zodResolver(sequenceSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence.id]);

  const onSubmit = async (values: SequenceFormValues) => {
    const res = await updateSequenceAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Sequence updated" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${sequence.name}`}
      description="Rename the sequence or update its description. Steps are managed below."
      size="md"
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
        <Field label="Sequence name" required error={errors.name?.message}>
          <Input autoFocus {...register("name")} placeholder="Cold outreach — 3 touch" />
        </Field>
        <Field label="Description" error={errors.description?.message}>
          <Textarea rows={3} {...register("description")} placeholder="Optional — what this sequence is for." />
        </Field>
      </form>
    </Modal>
  );
}
