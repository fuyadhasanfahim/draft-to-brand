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
  archiveLeadSourceAction,
  upsertLeadSourceAction,
} from "@/actions/lead-sources";
import {
  leadSourceSchema,
  type LeadSourceInput,
} from "@/lib/validators/reference-data";
import { slugify } from "@/lib/validators/onboarding";
import { ReferenceList, type ReferenceRow } from "./reference-list";
import { TagChip } from "@/features/crm/tag-chip";

type Row = ReferenceRow & { color: string };

export function LeadSourcesPageClient({
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
            id: "color",
            accessorFn: (r) => r.color,
            header: "Preview",
            cell: ({ row }) => (
              <TagChip name={row.original.name} color={row.original.color} />
            ),
            enableSorting: false,
          },
        ]}
        onEdit={(r) => setEditing(r)}
        onArchive={(id) => archiveLeadSourceAction(id)}
        canManage={canManage}
        onCreate={() => setCreateOpen(true)}
        searchPlaceholder="Search lead sources…"
        emptyTitle="No lead sources yet"
      />
      <LeadSourceDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing ? (
        <LeadSourceDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          row={editing}
        />
      ) : null}
    </>
  );
}

function LeadSourceDialog({
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

  const defaults: LeadSourceInput = row
    ? {
        id: row.id,
        name: row.name,
        slug: row.slug,
        color: row.color,
        isActive: row.isActive,
      }
    : { name: "", slug: "", color: "#6b6e6e", isActive: true };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadSourceInput>({
    resolver: zodResolver(leadSourceSchema),
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

  const onSubmit = async (values: LeadSourceInput) => {
    const res = await upsertLeadSourceAction(values);
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
      title={isEdit ? `Edit ${row?.name}` : "New lead source"}
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
            <Input autoFocus placeholder="Referral" {...register("name")} />
          </Field>
          <Field label="Slug" required error={errors.slug?.message}>
            <Input
              spellCheck={false}
              {...register("slug", { onChange: () => (slugDirty.current = true) })}
            />
          </Field>
        </div>
        <Field label="Color" hint="Hex code like #ff3131" error={errors.color?.message}>
          <Input
            type="text"
            spellCheck={false}
            placeholder="#6b6e6e"
            {...register("color")}
          />
        </Field>
        <Switch
          checked={watch("isActive") ?? true}
          onCheckedChange={(v) => setValue("isActive", v)}
          label="Active"
        />
      </form>
    </Modal>
  );
}
