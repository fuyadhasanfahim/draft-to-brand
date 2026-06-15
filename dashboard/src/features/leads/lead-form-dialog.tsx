"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  DatePicker,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { upsertLeadAction } from "@/actions/leads";
import {
  leadSchema,
  CURRENCY_VALUES,
  CURRENCY_LABELS,
  type LeadFormValues,
} from "@/lib/validators/leads";

/**
 * Edit-only Lead modal. Creation moved to the dedicated /dashboard/leads/new
 * page (Phase 2C). Owner + Status are NOT shown — Owner is set once at
 * create time (server uses the current member) and reassigned from the Lead
 * detail; Status is derived from the chosen stage's outcome.
 */
export type LeadEditable = {
  id: string;
  title: string;
  companyId: string | null;
  contactId: string | null;
  leadSourceId: string | null;
  ownerId: string | null;
  pipelineId: string;
  stageId: string;
  status: "OPEN" | "WON" | "LOST";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedValue: number | null;
  currency: LeadFormValues["currency"] | null;
  expectedCloseDate: Date | null;
  description: string | null;
};

export type PipelineWithStages = {
  id: string;
  name: string;
  isArchived: boolean;
  stages: { id: string; name: string; sortOrder: number }[];
};

export type LeadFormChoices = {
  pipelines: PipelineWithStages[];
  companies: { id: string; name: string }[];
  contacts: { id: string; name: string; companyId: string | null }[];
  leadSources: { id: string; name: string }[];
  // Members list still ships through choices for the detail page's owner
  // reassign control, but isn't surfaced inside the modal.
  owners: { id: string; name: string }[];
};

const PRIORITY_OPTIONS: LeadFormValues["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  choices,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: LeadEditable;
  choices: LeadFormChoices;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const defaults: LeadFormValues = {
    id: lead.id,
    title: lead.title,
    companyId: lead.companyId,
    contactId: lead.contactId,
    leadSourceId: lead.leadSourceId,
    pipelineId: lead.pipelineId,
    stageId: lead.stageId,
    priority: lead.priority,
    estimatedValue: lead.estimatedValue,
    currency: lead.currency,
    expectedCloseDate: lead.expectedCloseDate,
    description: lead.description,
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const pipelineId = watch("pipelineId");
  const stageId = watch("stageId");
  const companyId = watch("companyId");
  const currentPipeline = React.useMemo(
    () => choices.pipelines.find((p) => p.id === pipelineId) ?? null,
    [choices.pipelines, pipelineId]
  );

  // H3 — Pipeline change requires explicit confirmation. We stash the
  // user's desired next pipeline and only commit (clearing stage) when
  // they click "Continue" in the confirm modal.
  const [pendingPipelineId, setPendingPipelineId] = React.useState<string | null>(null);
  const pendingPipeline = React.useMemo(
    () => choices.pipelines.find((p) => p.id === pendingPipelineId) ?? null,
    [choices.pipelines, pendingPipelineId]
  );

  const onPipelineSelect = (nextId: string) => {
    if (!nextId || nextId === pipelineId) return;
    setPendingPipelineId(nextId);
  };
  const confirmPipelineChange = () => {
    if (!pendingPipelineId) return;
    setValue("pipelineId", pendingPipelineId);
    // No auto-select: user must explicitly pick a stage from the destination.
    setValue("stageId", "");
    setPendingPipelineId(null);
  };
  const cancelPipelineChange = () => setPendingPipelineId(null);

  const visibleContacts = React.useMemo(
    () =>
      companyId
        ? choices.contacts.filter((c) => !c.companyId || c.companyId === companyId)
        : choices.contacts,
    [choices.contacts, companyId]
  );

  const onSubmit = async (values: LeadFormValues) => {
    const res = await upsertLeadAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: "Lead updated" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${lead.title}`}
      description="Status is derived from the chosen stage. Owner is reassigned from the Lead detail."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={!stageId}
          >
            Save changes
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {currentPipeline?.isArchived ? (
          <div
            role="alert"
            className="rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-3 py-2 text-[12px] text-[var(--color-warning)]"
          >
            This Lead belongs to an archived pipeline. Move it to an active
            pipeline before continuing.
          </div>
        ) : null}

        <Field label="Title" required error={errors.title?.message}>
          <Input autoFocus {...register("title")} />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Pipeline" required error={errors.pipelineId?.message}>
            <Select
              value={pipelineId}
              onChange={(e) => onPipelineSelect(e.target.value)}
            >
              {choices.pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isArchived ? `[Archived] ${p.name}` : p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Stage"
            required
            error={
              errors.stageId?.message ||
              (stageId ? undefined : "Please select a stage.")
            }
          >
            <Select
              value={stageId}
              onChange={(e) => setValue("stageId", e.target.value)}
            >
              <option value="">— Select a stage —</option>
              {(currentPipeline?.stages ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" required>
            <Select
              value={watch("priority")}
              onChange={(e) => setValue("priority", e.target.value as LeadFormValues["priority"])}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company">
            <Select
              value={watch("companyId") ?? ""}
              onChange={(e) => setValue("companyId", e.target.value || null)}
            >
              <option value="">—</option>
              {choices.companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Contact">
            <Select
              value={watch("contactId") ?? ""}
              onChange={(e) => setValue("contactId", e.target.value || null)}
            >
              <option value="">—</option>
              {visibleContacts.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Lead source">
            <Select
              value={watch("leadSourceId") ?? ""}
              onChange={(e) => setValue("leadSourceId", e.target.value || null)}
            >
              <option value="">—</option>
              {choices.leadSources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Expected close">
            <DatePicker
              value={toDate(watch("expectedCloseDate"))}
              onChange={(d) => setValue("expectedCloseDate", d)}
              size="md"
            />
          </Field>
          <Field label="Currency">
            <Select
              value={watch("currency") ?? ""}
              onChange={(e) =>
                setValue("currency", (e.target.value || null) as LeadFormValues["currency"])
              }
            >
              <option value="">—</option>
              {CURRENCY_VALUES.map((c) => (
                <option key={c} value={c}>
                  {c} — {CURRENCY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Estimated value" error={errors.estimatedValue?.message}>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={watch("estimatedValue") ?? ""}
            onChange={(e) =>
              setValue(
                "estimatedValue",
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          />
        </Field>

        <Field label="Description">
          <Textarea rows={3} {...register("description")} />
        </Field>
      </form>

      {/* H3 — confirmation when the user changes pipeline. We render this as
          a second Modal stacked above the form; the Modal primitive z-orders
          correctly because each instance owns its own backdrop. */}
      <Modal
        open={pendingPipelineId !== null}
        onOpenChange={(v) => (!v ? cancelPipelineChange() : null)}
        title="Move Lead to another Pipeline?"
        description="Changing the pipeline will require selecting a new stage from the destination pipeline."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={cancelPipelineChange}>Cancel</Button>
            <Button variant="primary" onClick={confirmPipelineChange}>
              Continue
            </Button>
          </>
        }
      >
        {pendingPipeline ? (
          <p className="text-[13px] text-[var(--color-muted-foreground)]">
            Destination: <span className="font-medium text-[var(--color-foreground)]">{pendingPipeline.name}</span>
            {pendingPipeline.isArchived ? " (archived)" : ""}
          </p>
        ) : null}
      </Modal>
    </Modal>
  );
}
