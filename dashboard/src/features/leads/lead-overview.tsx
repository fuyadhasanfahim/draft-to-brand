import Link from "next/link";
import { format } from "date-fns";

type Row = { label: string; value: React.ReactNode };

function Row({ label, value }: Row) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-[13px]">
      <dt className="text-[var(--color-muted)]">{label}</dt>
      <dd className="col-span-2 text-[var(--color-foreground)] min-w-0 break-words">
        {value ?? "—"}
      </dd>
    </div>
  );
}

export function LeadOverview({
  lead,
}: {
  lead: {
    pipelineName: string;
    stageName: string;
    stageColor: string;
    status: string;
    priority: string;
    estimatedValue: string | null;
    currency: string | null;
    expectedCloseDate: Date | null;
    description: string | null;
    leadSource: { name: string; color: string } | null;
    owner: { name: string } | null;
    company: { id: string; name: string } | null;
    contact: { id: string; name: string } | null;
  };
}) {
  const money = (() => {
    if (!lead.estimatedValue) return null;
    const n = Number(lead.estimatedValue);
    if (Number.isNaN(n)) return null;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: lead.currency ?? "USD",
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `${n.toLocaleString()} ${lead.currency ?? ""}`.trim();
    }
  })();

  return (
    <dl className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] px-4">
      <Row
        label="Pipeline"
        value={lead.pipelineName}
      />
      <Row
        label="Stage"
        value={
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: lead.stageColor }}
            />
            {lead.stageName}
          </span>
        }
      />
      <Row label="Status"   value={lead.status} />
      <Row label="Priority" value={lead.priority} />
      <Row label="Value"    value={money ?? "—"} />
      <Row
        label="Expected close"
        value={lead.expectedCloseDate ? format(lead.expectedCloseDate, "MMM d, yyyy") : "—"}
      />
      <Row
        label="Owner"
        value={lead.owner?.name ?? "—"}
      />
      <Row
        label="Source"
        value={
          lead.leadSource ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: lead.leadSource.color }}
              />
              {lead.leadSource.name}
            </span>
          ) : (
            "—"
          )
        }
      />
      <Row
        label="Company"
        value={
          lead.company ? (
            <Link
              href={`/dashboard/companies/${lead.company.id}`}
              className="text-[var(--color-primary)] hover:underline"
            >
              {lead.company.name}
            </Link>
          ) : (
            "—"
          )
        }
      />
      <Row
        label="Contact"
        value={
          lead.contact ? (
            <Link
              href={`/dashboard/contacts`}
              className="text-[var(--color-primary)] hover:underline"
            >
              {lead.contact.name}
            </Link>
          ) : (
            "—"
          )
        }
      />
      <Row
        label="Description"
        value={
          lead.description ? (
            <p className="whitespace-pre-wrap leading-relaxed">{lead.description}</p>
          ) : (
            "—"
          )
        }
      />
    </dl>
  );
}
