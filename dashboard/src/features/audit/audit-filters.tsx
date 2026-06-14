"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  IconDownload,
  IconFilterOff,
  IconSearch,
} from "@tabler/icons-react";
import {
  Button,
  DatePicker,
  Input,
  Select,
} from "@/components/ui";
import { AUDIT_RESOURCES } from "./constants";

/**
 * Audit filters are URL-driven so they're shareable, bookmarkable, and
 * survive refresh. The server page reads `searchParams` and queries Prisma
 * from there — there's no client cache to fall out of sync.
 *
 * Layout philosophy:
 *
 *   - One row on desktop (≥ lg). Search stretches; everything else has
 *     a fixed-ish width.
 *   - Two rows on tablet (≥ md): controls on top, actions below.
 *   - Stacked on mobile.
 *
 * No native `<input type="date">` — uses the reusable `<DatePicker>`.
 */
export function AuditFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = React.useState(params.get("q") ?? "");
  const [resource, setResource] = React.useState(params.get("resource") ?? "");
  const [from, setFrom] = React.useState<Date | null>(parseIso(params.get("from")));
  const [to, setTo] = React.useState<Date | null>(parseIso(params.get("to")));

  React.useEffect(() => {
    setQ(params.get("q") ?? "");
    setResource(params.get("resource") ?? "");
    setFrom(parseIso(params.get("from")));
    setTo(parseIso(params.get("to")));
  }, [params]);

  const apply = () => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (resource) next.set("resource", resource);
    if (from) next.set("from", format(from, "yyyy-MM-dd"));
    if (to) next.set("to", format(to, "yyyy-MM-dd"));
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  const clear = () => {
    setQ("");
    setResource("");
    setFrom(null);
    setTo(null);
    router.push(pathname);
  };

  const exportHref = (() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (resource) next.set("resource", resource);
    if (from) next.set("from", format(from, "yyyy-MM-dd"));
    if (to) next.set("to", format(to, "yyyy-MM-dd"));
    return `/dashboard/audit/export${next.toString() ? "?" + next.toString() : ""}`;
  })();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="surface-card p-2.5"
    >
      <div
        className={[
          "flex flex-col gap-2",
          // Tablet (md): wrap the action cluster to a second row.
          "md:flex-row md:flex-wrap md:items-center",
          // Desktop (lg): everything in one row, no wrap.
          "lg:flex-nowrap",
        ].join(" ")}
      >
        {/* Search — flex-1 */}
        <div className="relative flex-1 min-w-0 md:min-w-[260px]">
          <IconSearch
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <Input
            placeholder="Actor, action, resource id…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 h-9 text-[13px]"
          />
        </div>

        {/* Resource — fixed 220 */}
        <Select
          value={resource}
          onChange={(e) => setResource(e.target.value)}
          className="h-9 text-[13px] md:w-[220px] shrink-0"
          aria-label="Resource"
        >
          <option value="">All resources</option>
          {AUDIT_RESOURCES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </Select>

        {/* From — fixed 180 */}
        <div className="md:w-[180px] shrink-0">
          <DatePicker
            value={from}
            onChange={setFrom}
            placeholder="From"
            label="From date"
            maxDate={to ?? null}
          />
        </div>

        {/* To — fixed 180 */}
        <div className="md:w-[180px] shrink-0">
          <DatePicker
            value={to}
            onChange={setTo}
            placeholder="To"
            label="To date"
            minDate={from ?? null}
            align="end"
          />
        </div>

        {/* Action cluster */}
        <div className="flex items-center gap-1 md:ml-auto lg:ml-0 shrink-0">
          <Button type="submit" variant="primary" size="sm">
            Apply
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={clear}
            aria-label="Clear filters"
            title="Clear filters"
          >
            <IconFilterOff size={14} />
          </Button>
          <a href={exportHref} className="inline-flex">
            <Button type="button" variant="secondary" size="sm">
              <IconDownload size={13} /> Export
            </Button>
          </a>
        </div>
      </div>
    </form>
  );
}

function parseIso(value: string | null): Date | null {
  if (!value) return null;
  try {
    const d = parseISO(value);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
