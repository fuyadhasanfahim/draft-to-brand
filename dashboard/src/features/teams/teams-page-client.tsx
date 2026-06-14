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
import type { Branch, Department, Team } from "@prisma/client";
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
import { archiveTeamAction, upsertTeamAction } from "@/actions/teams";
import { teamSchema, type TeamInput } from "@/lib/validators/org-graph";
import { slugify } from "@/lib/validators/onboarding";

type Row = Team & {
  branch: Pick<Branch, "id" | "name"> | null;
  department: Pick<Department, "id" | "name"> | null;
};

type LeadOption = { id: string; name: string };

export function TeamsPageClient({
  teams,
  branches,
  departments,
  leads,
  canManage,
}: {
  teams: Row[];
  branches: Pick<Branch, "id" | "name">[];
  departments: Pick<Department, "id" | "name" | "branchId">[];
  leads: LeadOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);

  const leadName = (id: string | null) =>
    id ? leads.find((l) => l.id === id)?.name ?? "—" : "—";

  const columns: ColumnDef<Row, unknown>[] = [
    {
      id: "name",
      accessorFn: (t) => t.name,
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--color-foreground)]">{row.original.name}</span>
          {row.original.archivedAt ? <Badge variant="neutral">Archived</Badge> : null}
        </div>
      ),
    },
    { id: "department", accessorFn: (t) => t.department?.name ?? "—", header: "Department" },
    { id: "branch", accessorFn: (t) => t.branch?.name ?? "—", header: "Branch" },
    {
      id: "lead",
      accessorFn: (t) => leadName(t.teamLeadId),
      header: "Team lead",
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
                  const res = await archiveTeamAction(row.original.id);
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
            <IconPlus size={15} /> New team
          </Button>
        ) : null}
      </div>
      <DataTable
        columns={columns}
        data={teams}
        searchPlaceholder="Search teams…"
        empty={{ title: "No teams yet" }}
      />

      <TeamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        branches={branches}
        departments={departments}
        leads={leads}
      />
      {editing ? (
        <TeamDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          team={editing}
          branches={branches}
          departments={departments}
          leads={leads}
        />
      ) : null}
    </>
  );
}

function TeamDialog({
  open,
  onOpenChange,
  team,
  branches,
  departments,
  leads,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  team?: Row;
  branches: Pick<Branch, "id" | "name">[];
  departments: Pick<Department, "id" | "name" | "branchId">[];
  leads: LeadOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(team);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    defaultValues: team
      ? {
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          branchId: team.branchId,
          departmentId: team.departmentId,
          teamLeadId: team.teamLeadId,
        }
      : { name: "", slug: "", branchId: null, departmentId: null, teamLeadId: null },
  });

  React.useEffect(() => {
    reset(
      team
        ? {
            id: team.id,
            name: team.name,
            slug: team.slug,
            description: team.description,
            branchId: team.branchId,
            departmentId: team.departmentId,
            teamLeadId: team.teamLeadId,
          }
        : { name: "", slug: "", branchId: null, departmentId: null, teamLeadId: null }
    );
  }, [team, reset]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, setValue, isEdit]);

  const selectedBranch = watch("branchId");
  const filteredDepartments = selectedBranch
    ? departments.filter((d) => !d.branchId || d.branchId === selectedBranch)
    : departments;

  const onSubmit = async (values: TeamInput) => {
    const res = await upsertTeamAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Team updated" : "Team created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${team?.name}` : "New team"}
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
        <Field label="Description">
          <Textarea rows={3} {...register("description")} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Branch">
            <Select
              value={selectedBranch ?? ""}
              onChange={(e) => {
                setValue("branchId", e.target.value || null);
                setValue("departmentId", null);
              }}
            >
              <option value="">—</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Department">
            <Select
              value={watch("departmentId") ?? ""}
              onChange={(e) => setValue("departmentId", e.target.value || null)}
            >
              <option value="">—</option>
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Team lead">
            <Select
              value={watch("teamLeadId") ?? ""}
              onChange={(e) => setValue("teamLeadId", e.target.value || null)}
            >
              <option value="">—</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
}
