"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconEdit,
  IconPlus,
} from "@tabler/icons-react";
import type { Branch } from "@prisma/client";
import {
  Badge,
  Button,
  DataTable,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  Field,
  Input,
  Modal,
  Switch,
  useToast,
} from "@/components/ui";
import { archiveBranchAction, upsertBranchAction } from "@/actions/branches";
import { branchSchema, type BranchInput } from "@/lib/validators/org-graph";
import { slugify } from "@/lib/validators/onboarding";

export function BranchesPageClient({
  branches,
  canManage,
}: {
  branches: Branch[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Branch | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns: ColumnDef<Branch, unknown>[] = [
    {
      id: "name",
      accessorFn: (b) => b.name,
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-foreground)]">{row.original.name}</span>
          {row.original.isHeadquarter ? <Badge variant="primary">HQ</Badge> : null}
          {row.original.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
        </div>
      ),
    },
    { id: "city", accessorFn: (b) => b.city ?? "—", header: "City" },
    { id: "country", accessorFn: (b) => b.country ?? "—", header: "Country" },
    {
      id: "createdAt",
      accessorFn: (b) => b.createdAt,
      header: "Created",
      cell: ({ row }) => (
        <span className="text-[12px] text-[var(--color-muted-foreground)]">
          {format(row.original.createdAt, "MMM d, yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canManage ? (
          <RowMenu
            branch={row.original}
            onEdit={() => setEditing(row.original)}
            onArchive={async () => {
              const res = await archiveBranchAction(row.original.id);
              if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
              else router.refresh();
            }}
          />
        ) : null,
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        {canManage ? (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <IconPlus size={15} /> New branch
          </Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={branches}
        searchPlaceholder="Search branches…"
        empty={{ title: "No branches yet" }}
      />

      <BranchDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing ? (
        <BranchDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          branch={editing}
        />
      ) : null}
    </>
  );
}

function RowMenu({
  branch,
  onEdit,
  onArchive,
}: {
  branch: Branch;
  onEdit: () => void;
  onArchive: () => void;
}) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <IconDots size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownContent>
        {/* TODO: Add a "View" action once a Branch detail page
            (/dashboard/branches/[id]) exists. Skipped for now — branches
            have no dedicated detail route. */}
        <DropdownItem onSelect={onEdit}>
          <IconEdit size={14} /> Edit
        </DropdownItem>
        <DropdownItem onSelect={onArchive}>
          {branch.archivedAt ? <IconArchiveOff size={14} /> : <IconArchive size={14} />}
          {branch.archivedAt ? "Restore" : "Archive"}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

function BranchDialog({
  open,
  onOpenChange,
  branch,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  branch?: Branch;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(branch);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchInput>({
    resolver: zodResolver(branchSchema),
    defaultValues: branch
      ? {
          id: branch.id,
          name: branch.name,
          slug: branch.slug,
          address: branch.address,
          city: branch.city,
          country: branch.country,
          isHeadquarter: branch.isHeadquarter,
        }
      : { name: "", slug: "", isHeadquarter: false },
  });

  React.useEffect(() => {
    reset(
      branch
        ? {
            id: branch.id,
            name: branch.name,
            slug: branch.slug,
            address: branch.address,
            city: branch.city,
            country: branch.country,
            isHeadquarter: branch.isHeadquarter,
          }
        : { name: "", slug: "", isHeadquarter: false }
    );
  }, [branch, reset]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, setValue, isEdit]);

  const onSubmit = async (values: BranchInput) => {
    const res = await upsertBranchAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Branch updated" : "Branch created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${branch?.name}` : "New branch"}
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
        <Field label="Address">
          <Input {...register("address")} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="City">
            <Input {...register("city")} />
          </Field>
          <Field label="Country">
            <Input {...register("country")} />
          </Field>
        </div>
        <Switch
          checked={watch("isHeadquarter") ?? false}
          onCheckedChange={(v) => setValue("isHeadquarter", v)}
          label="Headquarter branch"
        />
      </form>
    </Modal>
  );
}
