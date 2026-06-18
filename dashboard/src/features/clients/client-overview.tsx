import Link from "next/link";
import { format } from "date-fns";

type RowProps = { label: string; value: React.ReactNode };

function Row({ label, value }: RowProps) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-[13px]">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd className="col-span-2 text-[var(--color-foreground)] min-w-0 break-words">
        {value ?? "—"}
      </dd>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};
const ONBOARDING_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export function ClientOverview({
  client,
}: {
  client: {
    status: string;
    onboardingStatus: string;
    startDate: Date | null;
    notes: string | null;
    owner: { name: string } | null;
    company: { id: string; name: string };
    lead: { id: string; title: string } | null;
  };
}) {
  return (
    <dl className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] px-4">
      <Row label="Status" value={STATUS_LABEL[client.status] ?? client.status} />
      <Row label="Onboarding" value={ONBOARDING_LABEL[client.onboardingStatus] ?? client.onboardingStatus} />
      <Row
        label="Start date"
        value={client.startDate ? format(client.startDate, "MMM d, yyyy") : "—"}
      />
      <Row label="Owner" value={client.owner?.name ?? "—"} />
      <Row
        label="Company"
        value={
          <Link
            href={`/dashboard/companies/${client.company.id}`}
            className="text-[var(--color-primary)] hover:underline"
          >
            {client.company.name}
          </Link>
        }
      />
      <Row
        label="Converted from"
        value={
          client.lead ? (
            <Link
              href={`/dashboard/leads/${client.lead.id}`}
              className="text-[var(--color-primary)] hover:underline"
            >
              {client.lead.title}
            </Link>
          ) : (
            <span className="text-[var(--color-muted)]">Manually created</span>
          )
        }
      />
      <Row
        label="Notes"
        value={
          client.notes ? (
            <p className="whitespace-pre-wrap leading-relaxed">{client.notes}</p>
          ) : (
            "—"
          )
        }
      />
    </dl>
  );
}
