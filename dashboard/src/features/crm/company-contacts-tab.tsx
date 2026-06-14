"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
} from "@/components/ui";
import {
  ContactFormDialog,
  type CompanyChoice,
} from "./contact-form-dialog";
import type { ContactRow } from "./contacts-page-client";
import type { TagOption } from "./tag-selector";

export function CompanyContactsTab({
  companyId,
  companyName,
  contacts,
  tags,
  canManage,
  canManageTags,
}: {
  companyId: string;
  companyName: string;
  contacts: ContactRow[];
  tags: TagOption[];
  canManage: boolean;
  canManageTags: boolean;
}) {
  const router = useRouter();
  void router;
  const [open, setOpen] = React.useState(false);
  // Locked select still needs an option so the value renders.
  const lockedCompanies: CompanyChoice[] = [{ id: companyId, name: companyName }];

  return (
    <div className="flex flex-col gap-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
            <IconPlus size={13} /> Add contact
          </Button>
        </div>
      ) : null}

      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts on this company"
          description={canManage ? "Add someone you talk to here." : "Ask an admin to add contacts."}
        />
      ) : (
        <ul className="surface-card divide-y divide-[var(--color-border)]">
          {contacts.map((c) => {
            const full = `${c.firstName} ${c.lastName}`;
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={full} size="sm" />
                <div className="flex flex-col leading-tight min-w-0 flex-1">
                  <Link
                    href={`/dashboard/contacts`}
                    className="font-medium text-[13px] text-[var(--color-foreground)] truncate hover:text-[var(--color-primary)]"
                  >
                    {full}
                  </Link>
                  <span className="text-[11px] text-[var(--color-muted)] truncate">
                    {c.jobTitle ?? "—"}
                    {c.email ? ` · ${c.email}` : ""}
                  </span>
                </div>
                {c.status === "ARCHIVED" ? (
                  <Badge variant="neutral">Archived</Badge>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canManage ? (
        <ContactFormDialog
          open={open}
          onOpenChange={setOpen}
          companies={lockedCompanies}
          lockedCompanyId={companyId}
          tags={tags}
          canManageTags={canManageTags}
        />
      ) : null}
    </div>
  );
}
