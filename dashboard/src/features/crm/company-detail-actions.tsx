"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconArchive,
  IconArchiveOff,
  IconEdit,
} from "@tabler/icons-react";
import { Button, useToast } from "@/components/ui";
import { archiveCompanyAction } from "@/actions/companies";
import {
  CompanyFormDialog,
  type CompanyEditable,
  type IndustryChoice,
  type CountryChoice,
  type CompanySizeChoice,
  type LeadSourceChoice,
  type MemberChoice,
  type ContactChoice,
} from "./company-form-dialog";
import type { TagOption } from "./tag-selector";

export function CompanyDetailActions({
  company,
  tags,
  canManageTags,
  industries,
  countries,
  companySizes,
  leadSources,
  owners,
  primaryContactCandidates,
}: {
  company: CompanyEditable & { archivedAt: Date | null };
  tags: TagOption[];
  canManageTags: boolean;
  industries: IndustryChoice[];
  countries: CountryChoice[];
  companySizes: CompanySizeChoice[];
  leadSources: LeadSourceChoice[];
  owners: MemberChoice[];
  primaryContactCandidates: ContactChoice[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const toggleArchive = async () => {
    setBusy(true);
    const res = await archiveCompanyAction(company.id);
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Action failed", description: res.error });
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => setEditOpen(true)}>
        <IconEdit size={14} /> Edit
      </Button>
      <Button variant="ghost" onClick={toggleArchive} loading={busy}>
        {company.archivedAt ? <IconArchiveOff size={14} /> : <IconArchive size={14} />}
        {company.archivedAt ? "Restore" : "Archive"}
      </Button>
      <CompanyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        company={company}
        tags={tags}
        canManageTags={canManageTags}
        industries={industries}
        countries={countries}
        companySizes={companySizes}
        leadSources={leadSources}
        owners={owners}
        primaryContactCandidates={primaryContactCandidates}
      />
    </div>
  );
}
