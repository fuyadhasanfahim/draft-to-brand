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
  description: string | null;
  status: "ACTIVE" | "PROSPECT" | "ARCHIVED";
  industryId: string | null;
  countryId: string | null;
  companySizeId: string | null;
  leadSourceId: string | null;
  ownerId: string | null;
  primaryContactId: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  tagIds: string[];
};

export type IndustryChoice    = { id: string; name: string };
export type CountryChoice     = { id: string; name: string; iso2: string };
export type CompanySizeChoice = { id: string; name: string; sortOrder: number };
export type LeadSourceChoice  = { id: string; name: string };
export type MemberChoice      = { id: string; name: string };
export type ContactChoice     = { id: string; name: string };

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  tags,
  canManageTags,
  industries,
  countries,
  companySizes,
  leadSources,
  owners,
  /** Only available when editing an existing company. */
  primaryContactCandidates,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company?: CompanyEditable;
  tags: TagOption[];
  canManageTags: boolean;
  industries: IndustryChoice[];
  countries: CountryChoice[];
  companySizes: CompanySizeChoice[];
  leadSources: LeadSourceChoice[];
  owners: MemberChoice[];
  primaryContactCandidates?: ContactChoice[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(company);

  const defaults: CompanyInput = company
    ? {
        id: company.id,
        name: company.name,
        slug: company.slug,
        website: company.website,
        description: company.description,
        status: company.status,
        industryId: company.industryId,
        countryId: company.countryId,
        companySizeId: company.companySizeId,
        leadSourceId: company.leadSourceId,
        ownerId: company.ownerId,
        primaryContactId: company.primaryContactId,
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
        industryId: null,
        countryId: null,
        companySizeId: null,
        leadSourceId: null,
        ownerId: null,
        primaryContactId: null,
        tagIds: [],
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: defaults,
  });

  React.useEffect(() => {
    reset(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

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
          <Field label="Name" required error={errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <Field label="Slug" required hint="Used in URLs" error={errors.slug?.message}>
            <Input
              spellCheck={false}
              {...register("slug", { onChange: () => (slugDirty.current = true) })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Status" required>
            <Select {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="PROSPECT">Prospect</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
          <Field label="Industry">
            <Select
              value={watch("industryId") ?? ""}
              onChange={(e) => setValue("industryId", e.target.value || null)}
            >
              <option value="">—</option>
              {industries.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Company size">
            <Select
              value={watch("companySizeId") ?? ""}
              onChange={(e) => setValue("companySizeId", e.target.value || null)}
            >
              <option value="">—</option>
              {companySizes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
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
            <Select
              value={watch("countryId") ?? ""}
              onChange={(e) => setValue("countryId", e.target.value || null)}
            >
              <option value="">—</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Lead source">
            <Select
              value={watch("leadSourceId") ?? ""}
              onChange={(e) => setValue("leadSourceId", e.target.value || null)}
            >
              <option value="">—</option>
              {leadSources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Account owner" hint="Member responsible">
            <Select
              value={watch("ownerId") ?? ""}
              onChange={(e) => setValue("ownerId", e.target.value || null)}
            >
              <option value="">—</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </Field>
          {isEdit && primaryContactCandidates && primaryContactCandidates.length > 0 ? (
            <Field label="Primary contact" hint="Main POC at this company">
              <Select
                value={watch("primaryContactId") ?? ""}
                onChange={(e) => setValue("primaryContactId", e.target.value || null)}
              >
                <option value="">—</option>
                {primaryContactCandidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          ) : null}
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
