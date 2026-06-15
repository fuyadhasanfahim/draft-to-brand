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
  Switch,
  Textarea,
  useToast,
} from "@/components/ui";
import { upsertPipelineAction } from "@/actions/pipelines";
import { pipelineSchema, type PipelineInput } from "@/lib/validators/leads";
import { slugify } from "@/lib/validators/onboarding";

export type PipelineEditable = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDefault: boolean;
};

export function PipelineFormDialog({
  open,
  onOpenChange,
  pipeline,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pipeline?: PipelineEditable;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(pipeline);

  const defaults: PipelineInput = pipeline
    ? {
        id: pipeline.id,
        name: pipeline.name,
        slug: pipeline.slug,
        description: pipeline.description,
        isDefault: pipeline.isDefault,
      }
    : { name: "", slug: "", description: null, isDefault: false };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PipelineInput>({
    resolver: zodResolver(pipelineSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipeline?.id]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, setValue, isEdit]);

  const onSubmit = async (values: PipelineInput) => {
    const res = await upsertPipelineAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Pipeline updated" : "Pipeline created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${pipeline?.name}` : "New pipeline"}
      description="A pipeline is a sequence of stages a lead walks through."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" required error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <Field label="Slug" required error={errors.slug?.message}>
            <Input
              spellCheck={false}
              {...register("slug", { onChange: () => (slugDirty.current = true) })}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea rows={3} {...register("description")} />
        </Field>
        <Switch
          checked={watch("isDefault") ?? false}
          onCheckedChange={(v) => setValue("isDefault", v)}
          label="Default pipeline (used for new leads)"
        />
      </form>
    </Modal>
  );
}
