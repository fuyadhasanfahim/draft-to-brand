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
  useToast,
} from "@/components/ui";
import { upsertPipelineStageAction } from "@/actions/pipelines";
import {
  pipelineStageSchema,
  type PipelineStageInput,
} from "@/lib/validators/leads";
import { slugify } from "@/lib/validators/onboarding";

export type StageEditable = {
  id: string;
  pipelineId: string;
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  winProbability: number;
};

export function StageFormDialog({
  open,
  onOpenChange,
  stage,
  pipelineId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stage?: StageEditable;
  pipelineId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(stage);

  const defaults: PipelineStageInput = stage
    ? {
        id: stage.id,
        pipelineId: stage.pipelineId,
        name: stage.name,
        slug: stage.slug,
        color: stage.color,
        sortOrder: stage.sortOrder,
        winProbability: stage.winProbability,
      }
    : {
        pipelineId,
        name: "",
        slug: "",
        color: "#6b6e6e",
        winProbability: 0,
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PipelineStageInput>({
    resolver: zodResolver(pipelineStageSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage?.id, pipelineId]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, setValue, isEdit]);

  const onSubmit = async (values: PipelineStageInput) => {
    const res = await upsertPipelineStageAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Stage updated" : "Stage created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${stage?.name}` : "New stage"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Color" hint="Hex like #2563eb" error={errors.color?.message}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={watch("color") ?? "#6b6e6e"}
                onChange={(e) => setValue("color", e.target.value)}
                className="h-10 w-12 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer"
                aria-label="Pick stage color"
              />
              <Input
                spellCheck={false}
                value={watch("color") ?? ""}
                onChange={(e) => setValue("color", e.target.value)}
              />
            </div>
          </Field>
          <Field
            label="Win probability"
            hint="0–100 — how likely deals close from this stage"
            error={errors.winProbability?.message}
          >
            <Input
              type="number"
              min={0}
              max={100}
              value={watch("winProbability") ?? 0}
              onChange={(e) => setValue("winProbability", Number(e.target.value))}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
