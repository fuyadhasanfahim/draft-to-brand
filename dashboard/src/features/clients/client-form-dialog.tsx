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
import { upsertClientAction } from "@/actions/clients";
import {
  clientSchema,
  type ClientFormValues,
} from "@/lib/validators/clients";

export type ClientEditable = {
  id: string;
  companyId: string;
  ownerId: string | null;
  status: "ACTIVE" | "INACTIVE";
  onboardingStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  startDate: Date | null;
  notes: string | null;
};

export type ClientFormChoices = {
  companies: { id: string; name: string }[];
  owners: { id: string; name: string }[];
};

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  choices,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client?: ClientEditable;
  choices: ClientFormChoices;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(client);

  const defaults: ClientFormValues = client
    ? {
        id: client.id,
        companyId: client.companyId,
        ownerId: client.ownerId,
        status: client.status,
        onboardingStatus: client.onboardingStatus,
        startDate: client.startDate,
        notes: client.notes,
      }
    : {
        companyId: choices.companies[0]?.id ?? "",
        ownerId: null,
        status: "ACTIVE",
        onboardingStatus: "NOT_STARTED",
        startDate: null,
        notes: null,
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id]);

  const onSubmit = async (values: ClientFormValues) => {
    const res = await upsertClientAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Client updated" : "Client created" });
    onOpenChange(false);
    if (!isEdit && res.id) router.push(`/dashboard/clients/${res.id}`);
    else router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit client" : "New client"}
      description="Clients are post-sale customers; future modules (Projects, Invoices) attach here."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create client"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Field
          label="Company"
          required
          error={errors.companyId?.message}
          hint={isEdit ? "Changing the company creates a 1:1 collision risk." : undefined}
        >
          <Select
            value={watch("companyId") ?? ""}
            onChange={(e) => setValue("companyId", e.target.value)}
          >
            {choices.companies.length === 0 ? (
              <option value="">No companies available</option>
            ) : null}
            {choices.companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Status" required>
            <Select
              value={watch("status")}
              onChange={(e) => setValue("status", e.target.value as ClientFormValues["status"])}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </Field>
          <Field label="Onboarding" required>
            <Select
              value={watch("onboardingStatus")}
              onChange={(e) =>
                setValue(
                  "onboardingStatus",
                  e.target.value as ClientFormValues["onboardingStatus"]
                )
              }
            >
              <option value="NOT_STARTED">Not started</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Owner" hint="Account manager">
            <Select
              value={watch("ownerId") ?? ""}
              onChange={(e) => setValue("ownerId", e.target.value || null)}
            >
              <option value="">—</option>
              {choices.owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Start date">
            <DatePicker
              value={toDate(watch("startDate"))}
              onChange={(d) => setValue("startDate", d)}
              size="md"
            />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea rows={3} {...register("notes")} />
        </Field>
      </form>
    </Modal>
  );
}
