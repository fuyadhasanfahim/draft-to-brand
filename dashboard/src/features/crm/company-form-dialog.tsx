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
import { upsertCompanyAction } from "@/actions/companies";
import { companySchema, type CompanyInput } from "@/lib/validators/crm";
import { slugify } from "@/lib/validators/onboarding";
import { TagSelector, type TagOption } from "./tag-selector";

export type CompanyEditable = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  status: "ACTIVE" | "PROSPECT" | "ARCHIVED";
  size: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tagIds: string[];
};

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  tags,
  canManageTags,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company?: CompanyEditable;
  tags: TagOption[];
  canManageTags: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(company);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: company
      ? {
          id: company.id,
          name: company.name,
          slug: company.slug,
          website: company.website,
          industry: company.industry,
          description: company.description,
          status: company.status,
          size: company.size,
          country: company.country,
          city: company.city,
          address: company.address,
          phone: company.phone,
          email: company.email,
          tagIds: company.tagIds,
        }
      : {
          name: "",
          slug: "",
          status: "ACTIVE",
          tagIds: [],
        },
  });

  React.useEffect(() => {
    reset(
      company
        ? {
            id: company.id,
            name: company.name,
            slug: company.slug,
            website: company.website,
            industry: company.industry,
            description: company.description,
            status: company.status,
            size: company.size,
            country: company.country,
            city: company.city,
            address: company.address,
            phone: company.phone,
            email: company.email,
            tagIds: company.tagIds,
          }
        : { name: "", slug: "", status: "ACTIVE", tagIds: [] }
    );
  }, [company, reset]);

  const slugDirty = React.useRef(isEdit);
  const name = watch("name");
  React.useEffect(() => {
    if (slugDirty.current || isEdit) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, setValue, isEdit]);

  const onSubmit = async (values: CompanyInput) => {
    const res = await upsertCompanyAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't save", description: res.error });
      return;
    }
    toast({ variant: "success", title: isEdit ? "Company updated" : "Company created" });
    onOpenChange(false);
    if (!isEdit && res.id) router.push(`/dashboard/companies/${res.id}`);
    else router.refresh();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${company?.name}` : "New company"}
      description="A company is the primary CRM record — contacts, notes, and (later) deals attach to it."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            {isEdit ? "Save changes" : "Create company"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <Field label="Slug" hint="Used in URLs" error={errors.slug?.message}>
            <Input
              spellCheck={false}
              {...register("slug", { onChange: () => (slugDirty.current = true) })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Status">
            <Select {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="PROSPECT">Prospect</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          <Field label="Industry">
            <Input {...register("industry")} placeholder="e.g. SaaS, Retail" />
          </Field>
          <Field label="Company size">
            <Input {...register("size")} placeholder="e.g. 11–50" />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Website" error={errors.website?.message}>
            <Input {...register("website")} placeholder="https://" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Phone">
            <Input {...register("phone")} />
          </Field>
          <Field label="Country">
            <Input {...register("country")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="City">
            <Input {...register("city")} />
          </Field>
          <Field label="Address">
            <Input {...register("address")} />
          </Field>
        </div>

        <Field label="Description">
          <Textarea rows={3} {...register("description")} />
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
