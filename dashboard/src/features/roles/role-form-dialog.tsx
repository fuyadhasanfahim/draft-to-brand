"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Input, Sheet, Textarea, useToast } from "@/components/ui";
import {
  createRoleAction,
  updateRoleAction,
} from "@/actions/roles";
import {
  createRoleSchema,
  type CreateRoleInput,
  type UpdateRoleInput,
} from "@/lib/validators/roles";
import { slugify } from "@/lib/validators/onboarding";
import { PermissionSelector } from "./permission-selector";

type Mode =
  | { kind: "create" }
  | {
      kind: "edit";
      role: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        isSystem: boolean;
        permissionKeys: string[];
      };
    };

export function RoleFormDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: Mode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = mode.kind === "edit";
  const isSystemEdit = isEdit && mode.role.isSystem;
  const isOwnerEdit = isSystemEdit && mode.role.slug === "owner";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues:
      mode.kind === "edit"
        ? {
            name: mode.role.name,
            slug: mode.role.slug,
            description: mode.role.description ?? "",
            permissionKeys: mode.role.permissionKeys,
          }
        : { name: "", slug: "", description: "", permissionKeys: [] },
  });

  React.useEffect(() => {
    reset(
      mode.kind === "edit"
        ? {
            name: mode.role.name,
            slug: mode.role.slug,
            description: mode.role.description ?? "",
            permissionKeys: mode.role.permissionKeys,
          }
        : { name: "", slug: "", description: "", permissionKeys: [] }
    );
  }, [mode, reset]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""), { shouldValidate: false });
  }, [name, setValue, isEdit]);

  const onSubmit = async (values: CreateRoleInput) => {
    const res = isEdit
      ? await updateRoleAction({ id: mode.role.id, ...values } as UpdateRoleInput)
      : await createRoleAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save role", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Role updated" : "Role created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${mode.role.name}` : "Create role"}
      description={
        isOwnerEdit
          ? "The Owner role is locked — it always has every permission."
          : "Pick a name, slug, and the permissions this role grants."
      }
      width="w-full sm:w-[640px]"
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" required error={errors.name?.message}>
            <Input {...register("name")} disabled={isSystemEdit} />
          </Field>
          <Field label="Slug" required hint="URL-safe identifier" error={errors.slug?.message}>
            <Input
              {...register("slug", { onChange: () => (slugDirty.current = true) })}
              disabled={isSystemEdit}
              spellCheck={false}
            />
          </Field>
        </div>
        <Field label="Description (optional)">
          <Textarea {...register("description")} rows={2} />
        </Field>

        <div>
          <p className="text-sm font-medium text-[var(--color-foreground)]">Permissions</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
            Pick what members holding this role can do. Direct user-level overrides
            still take precedence.
          </p>
          <PermissionSelector
            value={watch("permissionKeys") ?? []}
            onChange={(next) => setValue("permissionKeys", next, { shouldDirty: true })}
            disabled={isOwnerEdit}
          />
        </div>

        <div className="sticky bottom-0 -mx-5 mt-4 flex items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} disabled={isOwnerEdit}>
            {isEdit ? "Save changes" : "Create role"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
