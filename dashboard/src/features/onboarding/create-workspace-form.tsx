"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconBuildingSkyscraper } from "@tabler/icons-react";
import { createWorkspaceAction } from "@/actions/workspace";
import {
  createWorkspaceSchema,
  slugify,
  type CreateWorkspaceInput,
} from "@/lib/validators/onboarding";
import { Button, Field, Input, useToast } from "@/components/ui";

export function CreateWorkspaceForm() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "", slug: "" },
  });

  // Auto-fill slug from the name until the user manually edits the slug field.
  const slugDirty = React.useRef(false);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current) return;
    setValue("slug", slugify(name ?? ""), { shouldValidate: false });
  }, [name, setValue]);

  const onSubmit = async (values: CreateWorkspaceInput) => {
    const result = await createWorkspaceAction(values);
    if (!result.ok) {
      if (result.field) {
        setError(result.field, { message: result.error });
      } else {
        toast({ variant: "error", title: "Couldn't create workspace", description: result.error });
      }
      return;
    }
    toast({ variant: "success", title: "Workspace ready" });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="Workspace name" required error={errors.name?.message}>
        <Input
          autoFocus
          placeholder="Acme Studio"
          autoComplete="organization"
          {...register("name")}
        />
      </Field>

      <Field
        label="Workspace slug"
        required
        hint="Lowercase letters, numbers, and hyphens. Used in URLs."
        error={errors.slug?.message}
      >
        <Input
          placeholder="acme-studio"
          spellCheck={false}
          {...register("slug", {
            onChange: () => {
              slugDirty.current = true;
            },
          })}
        />
      </Field>

      <Button type="submit" variant="accent" loading={isSubmitting}>
        <IconBuildingSkyscraper size={16} />
        Create workspace
      </Button>
    </form>
  );
}
