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
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { upsertContactAction } from "@/actions/contacts";
import { contactSchema, type ContactInput } from "@/lib/validators/crm";
import { TagSelector, type TagOption } from "./tag-selector";

export type ContactEditable = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  status: "ACTIVE" | "ARCHIVED";
  companyId: string | null;
  tagIds: string[];
};

export type CompanyChoice = { id: string; name: string };

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  companies,
  /** When the dialog is launched from a company detail page, lock the company. */
  lockedCompanyId,
  tags,
  canManageTags,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contact?: ContactEditable;
  companies: CompanyChoice[];
  lockedCompanyId?: string;
  tags: TagOption[];
  canManageTags: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(contact);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: contact
      ? {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          jobTitle: contact.jobTitle,
          linkedinUrl: contact.linkedinUrl,
          notes: contact.notes,
          status: contact.status,
          companyId: contact.companyId,
          tagIds: contact.tagIds,
        }
      : {
          firstName: "",
          lastName: "",
          status: "ACTIVE",
          companyId: lockedCompanyId ?? null,
          tagIds: [],
        },
  });

  React.useEffect(() => {
    reset(
      contact
        ? {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            jobTitle: contact.jobTitle,
            linkedinUrl: contact.linkedinUrl,
            notes: contact.notes,
            status: contact.status,
            companyId: contact.companyId,
            tagIds: contact.tagIds,
          }
        : {
            firstName: "",
            lastName: "",
            status: "ACTIVE",
            companyId: lockedCompanyId ?? null,
            tagIds: [],
          }
    );
  }, [contact, lockedCompanyId, reset]);

  const onSubmit = async (values: ContactInput) => {
    const res = await upsertContactAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Contact updated" : "Contact created" });
    onOpenChange(false);
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${contact?.firstName} ${contact?.lastName}` : "New contact"}
      description="Contacts can stand alone or attach to a company."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create contact"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="First name" error={errors.firstName?.message}>
            <Input autoFocus {...register("firstName")} />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <Input {...register("lastName")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
          <Field label="Phone">
            <Input {...register("phone")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Job title">
            <Input {...register("jobTitle")} />
          </Field>
          <Field label="LinkedIn" error={errors.linkedinUrl?.message}>
            <Input {...register("linkedinUrl")} placeholder="https://www.linkedin.com/in/…" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company">
            <Select
              value={watch("companyId") ?? ""}
              disabled={Boolean(lockedCompanyId)}
              onChange={(e) => setValue("companyId", e.target.value || null)}
            >
              <option value="">—</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
        </div>

        <Field label="Notes" hint="Short freeform notes shown on the contact card. Use the Notes section for longer entries.">
          <Textarea rows={3} {...register("notes")} />
        </Field>

        <Field label="Tags">
          <TagSelector
            tags={tags}
            value={watch("tagIds") ?? []}
            onChange={(next) => setValue("tagIds", next, { shouldDirty: true })}
            canCreate={canManageTags}
          />
        </Field>
      </form>
    </Modal>
  );
}
