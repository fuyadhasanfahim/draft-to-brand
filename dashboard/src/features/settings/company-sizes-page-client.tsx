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
  useToast,
} from "@/components/ui";
import {
  archiveCompanySizeAction,
  upsertCompanySizeAction,
} from "@/actions/company-sizes";
import {
  companySizeSchema,
  type CompanySizeInput,
} from "@/lib/validators/reference-data";
import { slugify } from "@/lib/validators/onboarding";
import { ReferenceList, type ReferenceRow } from "./reference-list";

type Row = ReferenceRow & { sortOrder: number };

export function CompanySizesPageClient({
  rows,
  canManage,
}: {
  rows: Row[];
  canManage: boolean;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);

  return (
    <>
      <ReferenceList<Row>
        rows={rows}
        extraColumns={[
          {
            id: "sortOrder",
            accessorFn: (r) => r.sortOrder,
            header: "Sort",
            cell: ({ row }) => (
              <span className="text-[12px] text-[var(--color-muted-foreground)] tabular-nums">
                {row.original.sortOrder}
              </span>
            ),
          },
        ]}
        onEdit={(r) => setEditing(r)}
        onArchive={(id) => archiveCompanySizeAction(id)}
        canManage={canManage}
        onCreate={() => setCreateOpen(true)}
        searchPlaceholder="Search company sizes…"
        emptyTitle="No company sizes yet"
      />
      <CompanySizeDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing ? (
        <CompanySizeDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          row={editing}
        />
      ) : null}
    </>
  );
}

function CompanySizeDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row?: Row;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(row);

  const defaults: CompanySizeInput = row
    ? {
        id: row.id,
        name: row.name,
        slug: row.slug,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      }
    : { name: "", slug: "", sortOrder: 0, isActive: true };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanySizeInput>({
    resolver: zodResolver(companySizeSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.id]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, setValue, isEdit]);

  const onSubmit = async (values: CompanySizeInput) => {
    const res = await upsertCompanySizeAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Updated" : "Created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${row?.name}` : "New company size"}
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
            <Input autoFocus placeholder="11–50" {...register("name")} />
          </Field>
          <Field label="Slug" required error={errors.slug?.message}>
            <Input
              spellCheck={false}
              {...register("slug", { onChange: () => (slugDirty.current = true) })}
            />
          </Field>
        </div>
        <Field label="Sort order" hint="Lower numbers appear first in pickers">
          <Input
            type="number"
            min={0}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        </Field>
        <Switch
          checked={watch("isActive") ?? true}
          onCheckedChange={(v) => setValue("isActive", v)}
          label="Active (show in company pickers)"
        />
      </form>
    </Modal>
  );
}
