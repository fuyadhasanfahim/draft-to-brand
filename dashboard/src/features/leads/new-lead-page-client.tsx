"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  Badge,
  Button,
  DatePicker,
  Field,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { createLeadFromScratchAction } from "@/actions/leads";
import {
  newLeadFromScratchSchema,
  CURRENCY_VALUES,
  CURRENCY_LABELS,
  type NewLeadFormValues,
} from "@/lib/validators/leads";

type Choice = { id: string; name: string };

export type NewLeadChoices = {
  pipelines: {
    id: string;
    name: string;
    isDefault: boolean;
    stages: { id: string; name: string; outcome: "OPEN" | "WON" | "LOST"; sortOrder: number }[];
  }[];
  industries: Choice[];
  countries: { id: string; name: string; iso2: string }[];
  companySizes: Choice[];
  leadSources: Choice[];
};

export type ExistingCompanyOption = {
  id: string;
  name: string;
  website: string | null;
  industryId: string | null;
  countryId: string | null;
  companySizeId: string | null;
  leadSourceId: string | null;
};

export type ExistingContactOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  companyId: string | null;
};

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildEmptyDefaults(pipelines: NewLeadChoices["pipelines"]): NewLeadFormValues {
  const defaultPipeline = pipelines.find((p) => p.isDefault) ?? pipelines[0];
  return {
    title: "",
    pipelineId: defaultPipeline?.id ?? "",
    stageId: defaultPipeline?.stages[0]?.id ?? "",
    priority: "MEDIUM",
    companyId: null,
    company: {
      name: "",
      website: null,
      industryId: null,
      countryId: null,
      companySizeId: null,
      leadSourceId: null,
    },
    existingPrimaryContactId: null,
    primaryContact: {
      firstName: "",
      lastName: "",
      email: "",
      phone: null,
      jobTitle: null,
      linkedinUrl: null,
    },
    additionalContacts: [],
    expectedCloseDate: null,
    estimatedValue: null,
    currency: "USD",
    description: null,
  };
}

export function NewLeadPageClient({
  choices,
  existingCompanies,
  existingContacts,
  initialTodayCount,
}: {
  choices: NewLeadChoices;
  existingCompanies: ExistingCompanyOption[];
  existingContacts: ExistingContactOption[];
  initialTodayCount: number;
}) {
  const { toast } = useToast();
  const [todayCount, setTodayCount] = React.useState(initialTodayCount);
  // Bump the form key after a successful create — easiest way to force RHF
  // and all useState-backed comboboxes back to their defaults without
  // wiring a reset() into every input.
  const [formKey, setFormKey] = React.useState(0);

  const handleCreated = () => {
    setTodayCount((n) => n + 1);
    setFormKey((k) => k + 1);
    toast({ variant: "success", title: "Lead created successfully" });
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0">
        <NewLeadForm
          key={formKey}
          choices={choices}
          existingCompanies={existingCompanies}
          existingContacts={existingContacts}
          onCreated={handleCreated}
        />
      </div>
      <aside className="w-full lg:w-56 shrink-0">
        <TodayCounter count={todayCount} />
      </aside>
    </div>
  );
}

function TodayCounter({ count }: { count: number }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
        Today
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--color-foreground)]">
        {count}
      </p>
      <p className="text-[12px] text-[var(--color-muted-foreground)]">
        Lead{count === 1 ? "" : "s"} created
      </p>
    </div>
  );
}

function NewLeadForm({
  choices,
  existingCompanies,
  existingContacts,
  onCreated,
}: {
  choices: NewLeadChoices;
  existingCompanies: ExistingCompanyOption[];
  existingContacts: ExistingContactOption[];
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const defaults = React.useMemo(() => buildEmptyDefaults(choices.pipelines), [choices.pipelines]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<NewLeadFormValues>({
    resolver: zodResolver(newLeadFromScratchSchema) as unknown as Resolver<NewLeadFormValues>,
    defaultValues: defaults,
  });

  const additional = useFieldArray({ control, name: "additionalContacts" });

  const pipelineId = watch("pipelineId");
  const currentPipeline = React.useMemo(
    () => choices.pipelines.find((p) => p.id === pipelineId) ?? null,
    [choices.pipelines, pipelineId]
  );

  React.useEffect(() => {
    if (!currentPipeline) return;
    const stageId = watch("stageId");
    if (!currentPipeline.stages.some((s) => s.id === stageId)) {
      setValue("stageId", currentPipeline.stages[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId]);

  // Company picker state — `null` means "create new"; an id means reuse.
  const selectedCompanyId = watch("companyId") ?? null;
  const selectedCompany = React.useMemo(
    () => existingCompanies.find((c) => c.id === selectedCompanyId) ?? null,
    [existingCompanies, selectedCompanyId]
  );

  const pickCompany = (c: ExistingCompanyOption) => {
    setValue("companyId", c.id);
    // Mirror the company's reference data into the form fields so the rep
    // sees what they're attaching to. These get ignored server-side when
    // companyId is set, but they make the read-only summary useful.
    setValue("company.name", c.name);
    setValue("company.website", c.website);
    setValue("company.industryId", c.industryId);
    setValue("company.countryId", c.countryId);
    setValue("company.companySizeId", c.companySizeId);
    setValue("company.leadSourceId", c.leadSourceId);
    // When the company changes, any previously picked contact is no longer
    // valid (might belong to a different company). Clear it.
    setValue("existingPrimaryContactId", null);
  };

  const clearCompany = () => {
    setValue("companyId", null);
    setValue("company.name", "");
    setValue("company.website", null);
    setValue("company.industryId", null);
    setValue("company.countryId", null);
    setValue("company.companySizeId", null);
    setValue("company.leadSourceId", null);
    setValue("existingPrimaryContactId", null);
  };

  // Contact picker — limited to contacts at the chosen existing company.
  const contactsForCompany = React.useMemo(() => {
    if (!selectedCompanyId) return [];
    return existingContacts.filter((c) => c.companyId === selectedCompanyId);
  }, [existingContacts, selectedCompanyId]);

  const selectedPrimaryContactId = watch("existingPrimaryContactId") ?? null;
  const selectedPrimaryContact = React.useMemo(
    () => contactsForCompany.find((c) => c.id === selectedPrimaryContactId) ?? null,
    [contactsForCompany, selectedPrimaryContactId]
  );

  const pickContact = (c: ExistingContactOption) => {
    setValue("existingPrimaryContactId", c.id);
    // Mirror for display.
    setValue("primaryContact.firstName", c.firstName);
    setValue("primaryContact.lastName", c.lastName);
    setValue("primaryContact.email", c.email ?? "");
    setValue("primaryContact.phone", c.phone);
    setValue("primaryContact.jobTitle", c.jobTitle);
    setValue("primaryContact.linkedinUrl", c.linkedinUrl);
  };
  const clearContact = () => {
    setValue("existingPrimaryContactId", null);
    setValue("primaryContact.firstName", "");
    setValue("primaryContact.lastName", "");
    setValue("primaryContact.email", "");
    setValue("primaryContact.phone", null);
    setValue("primaryContact.jobTitle", null);
    setValue("primaryContact.linkedinUrl", null);
  };

  const [moreOpen, setMoreOpen] = React.useState(false);

  const onSubmit = async (values: NewLeadFormValues) => {
    const res = await createLeadFromScratchAction(values);
    if (!res.ok) {
      toast({ variant: "error", title: "Couldn't create lead", description: res.error });
      return;
    }
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 max-w-3xl">
      <div>
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1 text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-3"
        >
          <IconChevronLeft size={13} /> Leads
        </Link>
        <h1 className="text-display text-2xl text-[var(--color-foreground)]">New lead</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Search an existing company or contact, or fill the fields to create one. The form
          stays open after submit so you can enter the next lead.
        </p>
      </div>

      {/* Lead Information */}
      <Section title="Lead information" hint="Required to start moving the lead through a pipeline.">
        <Field label="Title" required error={errors.title?.message}>
          <Input autoFocus placeholder="e.g. Acme website redesign" {...register("title")} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Pipeline" required error={errors.pipelineId?.message}>
            <Select
              value={watch("pipelineId")}
              onChange={(e) => setValue("pipelineId", e.target.value)}
            >
              {choices.pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Stage" required error={errors.stageId?.message}>
            <Select
              value={watch("stageId")}
              onChange={(e) => setValue("stageId", e.target.value)}
            >
              {(currentPipeline?.stages ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" required>
            <Select
              value={watch("priority") ?? "MEDIUM"}
              onChange={(e) => setValue("priority", e.target.value as NewLeadFormValues["priority"])}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </Field>
        </div>
      </Section>

      {/* Company Information */}
      <Section title="Company information" hint="Search to attach to an existing company, or create a new one.">
        <Field label="Company" required error={errors.company?.name?.message}>
          <Combobox
            placeholder="Search companies…"
            items={existingCompanies.map((c) => ({ id: c.id, label: c.name }))}
            value={selectedCompanyId}
            displayValue={selectedCompany?.name ?? null}
            onPick={(id) => {
              const c = existingCompanies.find((x) => x.id === id);
              if (c) pickCompany(c);
            }}
            onClear={clearCompany}
            createLabel="Create new company"
          />
        </Field>

        {selectedCompany ? (
          <SelectedCompanySummary
            company={selectedCompany}
            industries={choices.industries}
            countries={choices.countries}
            companySizes={choices.companySizes}
            leadSources={choices.leadSources}
            onClear={clearCompany}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company name" required error={errors.company?.name?.message}>
                <Input placeholder="Acme Inc" {...register("company.name")} />
              </Field>
              <Field label="Website" error={errors.company?.website?.message}>
                <Input placeholder="https://acme.com" {...register("company.website")} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Industry">
                <Select
                  value={watch("company.industryId") ?? ""}
                  onChange={(e) => setValue("company.industryId", e.target.value || null)}
                >
                  <option value="">—</option>
                  {choices.industries.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Country">
                <Select
                  value={watch("company.countryId") ?? ""}
                  onChange={(e) => setValue("company.countryId", e.target.value || null)}
                >
                  <option value="">—</option>
                  {choices.countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Company size">
                <Select
                  value={watch("company.companySizeId") ?? ""}
                  onChange={(e) => setValue("company.companySizeId", e.target.value || null)}
                >
                  <option value="">—</option>
                  {choices.companySizes.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Lead source">
              <Select
                value={watch("company.leadSourceId") ?? ""}
                onChange={(e) => setValue("company.leadSourceId", e.target.value || null)}
              >
                <option value="">—</option>
                {choices.leadSources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          </>
        )}
      </Section>

      {/* Primary Contact */}
      <Section title="Primary contact" hint="The first POC at this company.">
        {selectedCompany ? (
          <Field label="Existing contact" hint="Pick someone already attached to this company.">
            <Combobox
              placeholder={
                contactsForCompany.length === 0
                  ? "No existing contacts at this company"
                  : "Search contacts at this company…"
              }
              items={contactsForCompany.map((c) => ({
                id: c.id,
                label: `${c.firstName} ${c.lastName}`,
                sub: c.email ?? undefined,
              }))}
              value={selectedPrimaryContactId}
              displayValue={
                selectedPrimaryContact
                  ? `${selectedPrimaryContact.firstName} ${selectedPrimaryContact.lastName}`
                  : null
              }
              onPick={(id) => {
                const c = contactsForCompany.find((x) => x.id === id);
                if (c) pickContact(c);
              }}
              onClear={clearContact}
              createLabel="Create new contact"
              disabled={contactsForCompany.length === 0}
            />
          </Field>
        ) : null}

        {selectedPrimaryContact ? (
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-[var(--color-foreground)]">
                {selectedPrimaryContact.firstName} {selectedPrimaryContact.lastName}
              </p>
              <p className="text-[12px] text-[var(--color-muted-foreground)]">
                {selectedPrimaryContact.email ?? "—"}
                {selectedPrimaryContact.jobTitle ? ` · ${selectedPrimaryContact.jobTitle}` : ""}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clearContact}>
              <IconX size={13} /> Change
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name" required error={errors.primaryContact?.firstName?.message}>
                <Input {...register("primaryContact.firstName")} />
              </Field>
              <Field label="Last name" required error={errors.primaryContact?.lastName?.message}>
                <Input {...register("primaryContact.lastName")} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Email" required error={errors.primaryContact?.email?.message}>
                <Input type="email" {...register("primaryContact.email")} />
              </Field>
              <Field label="Phone">
                <Input {...register("primaryContact.phone")} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Job title">
                <Input {...register("primaryContact.jobTitle")} />
              </Field>
              <Field label="LinkedIn" error={errors.primaryContact?.linkedinUrl?.message}>
                <Input placeholder="https://linkedin.com/in/…" {...register("primaryContact.linkedinUrl")} />
              </Field>
            </div>
          </>
        )}
      </Section>

      {/* Additional Contacts */}
      <Section
        title="Additional contacts"
        hint="Optional — add other people at this company you'll be talking to."
        collapsible
        open={moreOpen}
        onToggle={() => setMoreOpen((v) => !v)}
      >
        {additional.fields.length === 0 ? (
          <p className="text-[12px] text-[var(--color-muted)]">No additional contacts yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {additional.fields.map((f, idx) => (
              <li
                key={f.id}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] font-medium text-[var(--color-muted-foreground)]">
                    Contact {idx + 2}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove contact"
                    onClick={() => additional.remove(idx)}
                  >
                    <IconTrash size={14} />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="First name" required error={errors.additionalContacts?.[idx]?.firstName?.message}>
                    <Input {...register(`additionalContacts.${idx}.firstName`)} />
                  </Field>
                  <Field label="Last name" required error={errors.additionalContacts?.[idx]?.lastName?.message}>
                    <Input {...register(`additionalContacts.${idx}.lastName`)} />
                  </Field>
                  <Field label="Email" error={errors.additionalContacts?.[idx]?.email?.message}>
                    <Input type="email" {...register(`additionalContacts.${idx}.email`)} />
                  </Field>
                  <Field label="Phone">
                    <Input {...register(`additionalContacts.${idx}.phone`)} />
                  </Field>
                  <Field label="Job title">
                    <Input {...register(`additionalContacts.${idx}.jobTitle`)} />
                  </Field>
                  <Field label="LinkedIn" error={errors.additionalContacts?.[idx]?.linkedinUrl?.message}>
                    <Input {...register(`additionalContacts.${idx}.linkedinUrl`)} />
                  </Field>
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            additional.append({
              firstName: "",
              lastName: "",
              email: "",
              phone: null,
              jobTitle: null,
              linkedinUrl: null,
            })
          }
        >
          <IconPlus size={14} /> Add contact
        </Button>
      </Section>

      {/* Opportunity */}
      <Section title="Opportunity">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Expected close">
            <DatePicker
              value={toDate(watch("expectedCloseDate"))}
              onChange={(d) => setValue("expectedCloseDate", d)}
              size="md"
            />
          </Field>
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
          <Field label="Currency">
            <Select
              value={watch("currency") ?? ""}
              onChange={(e) =>
                setValue("currency", (e.target.value || null) as NewLeadFormValues["currency"])
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
        <Field label="Description" error={errors.description?.message}>
          <Textarea rows={3} {...register("description")} />
        </Field>
      </Section>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
        <Button type="submit" variant="primary" loading={isSubmitting}>
          Create lead <IconChevronRight size={14} />
        </Button>
      </div>
    </form>
  );
}

function SelectedCompanySummary({
  company,
  industries,
  countries,
  companySizes,
  leadSources,
  onClear,
}: {
  company: ExistingCompanyOption;
  industries: Choice[];
  countries: { id: string; name: string; iso2: string }[];
  companySizes: Choice[];
  leadSources: Choice[];
  onClear: () => void;
}) {
  const nameOf = (id: string | null, list: { id: string; name: string }[]) =>
    id ? list.find((x) => x.id === id)?.name ?? null : null;
  const rows: { label: string; value: string | null }[] = [
    { label: "Website", value: company.website },
    { label: "Industry", value: nameOf(company.industryId, industries) },
    { label: "Country", value: nameOf(company.countryId, countries) },
    { label: "Company size", value: nameOf(company.companySizeId, companySizes) },
    { label: "Lead source", value: nameOf(company.leadSourceId, leadSources) },
  ];

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[13px] font-medium text-[var(--color-foreground)] truncate">
            {company.name}
          </p>
          <Badge variant="primary">Existing</Badge>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <IconX size={13} /> Change
        </Button>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-3">
            <dt className="text-[var(--color-muted)]">{r.label}</dt>
            <dd className="text-[var(--color-muted-foreground)] truncate">{r.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
  collapsible,
  open,
  onToggle,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  const isOpen = !collapsible || open;
  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header
        className={`flex items-start justify-between gap-3 p-4 ${
          collapsible ? "cursor-pointer select-none" : ""
        }`}
        onClick={collapsible ? onToggle : undefined}
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggle?.();
                }
              }
            : undefined
        }
      >
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--color-foreground)]">{title}</h2>
          {hint ? (
            <p className="mt-0.5 text-[12px] text-[var(--color-muted-foreground)]">{hint}</p>
          ) : null}
        </div>
        {collapsible ? (
          <IconChevronDown
            size={16}
            className={`text-[var(--color-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        ) : null}
      </header>
      {isOpen ? (
        <div className="flex flex-col gap-4 p-4 pt-0 border-t border-[var(--color-border)]">
          <div className="pt-4 flex flex-col gap-4">{children}</div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Minimal type-to-search combobox. Substring match (case-insensitive), with
 * a trailing "+ Create new" option that calls `onClear` so the parent shows
 * the create form. Native HTML focus + key handling only — no extra deps.
 */
function Combobox({
  items,
  value,
  displayValue,
  placeholder,
  onPick,
  onClear,
  createLabel,
  disabled,
}: {
  items: { id: string; label: string; sub?: string }[];
  value: string | null;
  displayValue: string | null;
  placeholder?: string;
  onPick: (id: string) => void;
  onClear: () => void;
  createLabel?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 50);
    return items
      .filter((i) => i.label.toLowerCase().includes(q) || i.sub?.toLowerCase().includes(q))
      .slice(0, 50);
  }, [items, query]);

  // When a value is selected, render as a pill instead of an input. Click to clear.
  if (value && displayValue) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 h-10">
        <span className="text-sm text-[var(--color-foreground)] truncate">{displayValue}</span>
        <button
          type="button"
          onClick={onClear}
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          aria-label="Clear selection"
        >
          <IconX size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
          <IconSearch size={14} />
        </span>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-8"
        />
      </div>
      {open && !disabled ? (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg max-h-64 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-[var(--color-muted)]">No matches.</p>
          ) : (
            <ul className="py-1">
              {filtered.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(i.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--color-background)] transition-colors"
                  >
                    <p className="text-[13px] text-[var(--color-foreground)] truncate">{i.label}</p>
                    {i.sub ? (
                      <p className="text-[11px] text-[var(--color-muted)] truncate">{i.sub}</p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {createLabel ? (
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 border-t border-[var(--color-border)] text-[12px] font-medium text-[var(--color-primary)] hover:bg-[var(--color-background)] transition-colors"
            >
              <span className="inline-flex items-center gap-1">
                <IconPlus size={12} /> {createLabel}
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
