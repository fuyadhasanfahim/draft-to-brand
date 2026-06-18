"use client";

import * as React from "react";
import { IconAddressBook, IconSearch, IconTargetArrow } from "@tabler/icons-react";
import { Checkbox, Input } from "@/components/ui";

export type ContactOption = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
};

export type LeadOption = {
  id: string;
  title: string;
  email: string | null;
  company: string | null;
};

export type RecipientSelection = {
  contactIds: string[];
  leadIds: string[];
};

/**
 * Controlled multi-select for choosing campaign recipients from existing
 * Contacts and/or Leads. Pure UI — emits id arrays; the server resolves
 * addresses. Records without an email are still selectable (foundation phase,
 * no sending) but visibly flagged so the user knows tracking will be a no-op.
 */
export function RecipientSelector({
  contacts,
  leads,
  value,
  onChange,
}: {
  contacts: ContactOption[];
  leads: LeadOption[];
  value: RecipientSelection;
  onChange: (next: RecipientSelection) => void;
}) {
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const filteredContacts = React.useMemo(
    () =>
      !q
        ? contacts
        : contacts.filter((c) =>
            [c.name, c.email, c.company].filter(Boolean).join(" ").toLowerCase().includes(q)
          ),
    [contacts, q]
  );
  const filteredLeads = React.useMemo(
    () =>
      !q
        ? leads
        : leads.filter((l) =>
            [l.title, l.email, l.company].filter(Boolean).join(" ").toLowerCase().includes(q)
          ),
    [leads, q]
  );

  const contactSet = React.useMemo(() => new Set(value.contactIds), [value.contactIds]);
  const leadSet = React.useMemo(() => new Set(value.leadIds), [value.leadIds]);

  const toggleContact = (id: string) => {
    onChange({
      ...value,
      contactIds: contactSet.has(id)
        ? value.contactIds.filter((x) => x !== id)
        : [...value.contactIds, id],
    });
  };
  const toggleLead = (id: string) => {
    onChange({
      ...value,
      leadIds: leadSet.has(id)
        ? value.leadIds.filter((x) => x !== id)
        : [...value.leadIds, id],
    });
  };

  const selectedCount = value.contactIds.length + value.leadIds.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <IconSearch
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts or leads…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <span className="shrink-0 text-[12px] text-[var(--color-muted-foreground)] tabular-nums">
          {selectedCount} selected
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <RecipientColumn
          icon={<IconAddressBook size={14} />}
          title="Contacts"
          empty="No contacts match."
          rows={filteredContacts.map((c) => ({
            id: c.id,
            primary: c.name,
            secondary: c.email ?? "No email",
            tertiary: c.company,
            noEmail: !c.email,
            checked: contactSet.has(c.id),
            onToggle: () => toggleContact(c.id),
          }))}
        />
        <RecipientColumn
          icon={<IconTargetArrow size={14} />}
          title="Leads"
          empty="No leads match."
          rows={filteredLeads.map((l) => ({
            id: l.id,
            primary: l.title,
            secondary: l.email ?? "No contact email",
            tertiary: l.company,
            noEmail: !l.email,
            checked: leadSet.has(l.id),
            onToggle: () => toggleLead(l.id),
          }))}
        />
      </div>
    </div>
  );
}

type Row = {
  id: string;
  primary: string;
  secondary: string;
  tertiary: string | null;
  noEmail: boolean;
  checked: boolean;
  onToggle: () => void;
};

function RecipientColumn({
  icon,
  title,
  empty,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  rows: Row[];
}) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2 text-[12px] font-medium text-[var(--color-muted-foreground)]">
        <span className="text-[var(--color-muted)]">{icon}</span>
        {title}
        <span className="ml-auto tabular-nums text-[var(--color-muted)]">{rows.length}</span>
      </div>
      <div className="max-h-64 overflow-y-auto scrollbar-thin">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-[12px] text-[var(--color-muted)]">{empty}</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {rows.map((r) => (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-[var(--color-background)] transition-colors">
                  <Checkbox checked={r.checked} onChange={r.onToggle} />
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-[13px] font-medium text-[var(--color-foreground)]">
                      {r.primary}
                    </span>
                    <span
                      className={
                        "truncate text-[11px] " +
                        (r.noEmail ? "text-[var(--color-warning)]" : "text-[var(--color-muted)]")
                      }
                    >
                      {r.secondary}
                      {r.tertiary ? ` · ${r.tertiary}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
