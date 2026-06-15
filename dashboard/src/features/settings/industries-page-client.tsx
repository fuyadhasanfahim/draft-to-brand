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
  archiveIndustryAction,
  upsertIndustryAction,
} from "@/actions/industries";
import {
  industrySchema,
  type IndustryInput,
} from "@/lib/validators/reference-data";
import { slugify } from "@/lib/validators/onboarding";
import { ReferenceList, type ReferenceRow } from "./reference-list";

type Row = ReferenceRow;

export function IndustriesPageClient({
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
      <ReferenceList
        rows={rows}
        onEdit={(r) => setEditing(r)}
        onArchive={(id) => archiveIndustryAction(id)}
        canManage={canManage}
        onCreate={() => setCreateOpen(true)}
        searchPlaceholder="Search industries…"
        emptyTitle="No industries yet"
      />
      <IndustryDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing ? (
        <IndustryDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          row={editing}
        />
      ) : null}
    </>
  );
}

function IndustryDialog({
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

  const defaults: IndustryInput = row
    ? { id: row.id, name: row.name, slug: row.slug, isActive: row.isActive }
    : { name: "", slug: "", isActive: true };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IndustryInput>({
    resolver: zodResolver(industrySchema),
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

  const onSubmit = async (values: IndustryInput) => {
    const res = await upsertIndustryAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Industry updated" : "Industry created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${row?.name}` : "New industry"}
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
        <Switch
          checked={watch("isActive") ?? true}
          onCheckedChange={(v) => setValue("isActive", v)}
          label="Active (show in company pickers)"
        />
      </form>
    </Modal>
  );
}
