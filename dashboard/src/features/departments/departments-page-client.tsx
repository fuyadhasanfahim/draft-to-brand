"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  IconArchive,
  IconArchiveOff,
  IconDots,
  IconEdit,
  IconPlus,
} from "@tabler/icons-react";
import type { Branch, Department } from "@prisma/client";
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
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { archiveDepartmentAction, upsertDepartmentAction } from "@/actions/departments";
import { departmentSchema, type DepartmentInput } from "@/lib/validators/org-graph";
import { slugify } from "@/lib/validators/onboarding";

type Row = Department & { branch: Pick<Branch, "id" | "name"> | null };

export function DepartmentsPageClient({
  departments,
  branches,
  canManage,
}: {
  departments: Row[];
  branches: Pick<Branch, "id" | "name">[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const columns: ColumnDef<Row, unknown>[] = [
    {
      id: "name",
      accessorFn: (d) => d.name,
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-foreground)]">{row.original.name}</span>
          {row.original.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
        </div>
      ),
    },
    { id: "branch", accessorFn: (d) => d.branch?.name ?? "—", header: "Branch" },
    {
      id: "description",
      accessorFn: (d) => d.description ?? "",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-[12px] text-[var(--color-muted-foreground)]">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        canManage ? (
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                <IconDots size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem onSelect={() => setEditing(row.original)}>
                <IconEdit size={14} /> Edit
              </DropdownItem>
              <DropdownItem
                onSelect={async () => {
                  const res = await archiveDepartmentAction(row.original.id);
                  if (!res.ok) toast({ variant: "error", title: "Action failed", description: res.error });
                  else router.refresh();
                }}
              >
                {row.original.archivedAt ? <IconArchiveOff size={14} /> : <IconArchive size={14} />}
                {row.original.archivedAt ? "Restore" : "Archive"}
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        ) : null,
    },
  ];

  return (
    <>
      <div className="mb-3 flex justify-end">
        {canManage ? (
          <Button variant="accent" onClick={() => setCreateOpen(true)}>
            <IconPlus size={15} /> New department
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={departments}
        searchPlaceholder="Search departments…"
        empty={{ title: "No departments yet" }}
      />

      <DepartmentDialog open={createOpen} onOpenChange={setCreateOpen} branches={branches} />
      {editing ? (
        <DepartmentDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          department={editing}
          branches={branches}
        />
      ) : null}
    </>
  );
}

function DepartmentDialog({
  open,
  onOpenChange,
  department,
  branches,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  department?: Row;
  branches: Pick<Branch, "id" | "name">[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(department);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentInput>({
    resolver: zodResolver(departmentSchema),
    defaultValues: department
      ? {
          id: department.id,
          name: department.name,
          slug: department.slug,
          description: department.description,
          branchId: department.branchId,
        }
      : { name: "", slug: "", branchId: null },
  });

  React.useEffect(() => {
    reset(
      department
        ? {
            id: department.id,
            name: department.name,
            slug: department.slug,
            description: department.description,
            branchId: department.branchId,
          }
        : { name: "", slug: "", branchId: null }
    );
  }, [department, reset]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, setValue, isEdit]);

  const onSubmit = async (values: DepartmentInput) => {
    const res = await upsertDepartmentAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Department updated" : "Department created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${department?.name}` : "New department"}
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
          <Field label="Name" error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <Field label="Slug" error={errors.slug?.message}>
            <Input
              spellCheck={false}
              {...register("slug", { onChange: () => (slugDirty.current = true) })}
            />
          </Field>
        </div>
        <Field label="Branch (optional)">
          <Select
            value={watch("branchId") ?? ""}
            onChange={(e) => setValue("branchId", e.target.value || null)}
          >
            <option value="">—</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Description">
          <Textarea rows={3} {...register("description")} />
        </Field>
      </form>
    </Modal>
  );
}
