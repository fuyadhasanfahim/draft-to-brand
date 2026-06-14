"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { IconDownload, IconFilterOff, IconSearch } from "@tabler/icons-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { AUDIT_RESOURCES } from "./constants";

/**
 * Audit filters are URL-driven so they're shareable, bookmarkable, and
 * survive refresh. The server page reads `searchParams` and queries Prisma
 * from there — there's no client cache to fall out of sync.
 */
export function AuditFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = React.useState(params.get("q") ?? "");
  const [resource, setResource] = React.useState(params.get("resource") ?? "");
  const [from, setFrom] = React.useState(params.get("from") ?? "");
  const [to, setTo] = React.useState(params.get("to") ?? "");

  // Keep local state synced if user navigates externally.
  React.useEffect(() => {
    setQ(params.get("q") ?? "");
    setResource(params.get("resource") ?? "");
    setFrom(params.get("from") ?? "");
    setTo(params.get("to") ?? "");
  }, [params]);

  const apply = (overrides: Record<string, string> = {}) => {
    const next = new URLSearchParams();
    const values: Record<string, string> = { q, resource, from, to, ...overrides };
    for (const [k, v] of Object.entries(values)) {
      if (v && v.trim().length > 0) next.set(k, v.trim());
    }
    // Always reset to page 1 on filter change.
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  const clear = () => {
    setQ("");
    setResource("");
    setFrom("");
    setTo("");
    router.push(pathname);
  };

  const exportHref = (() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (resource) next.set("resource", resource);
    if (from) next.set("from", from);
    if (to) next.set("to", to);
    return `/dashboard/audit/export${next.toString() ? "?" + next.toString() : ""}`;
  })();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="surface-card p-3 flex flex-col gap-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-2">
        <Field label="Search">
          <div className="relative">
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
        </Field>
        <Field label="Resource">
          <Select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            className="h-9 text-[13px]"
          >
            <option value="">All</option>
            {AUDIT_RESOURCES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <Field label="From">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 text-[13px]"
          />
        </Field>
        <Field label="To">
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 text-[13px]"
          />
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="primary" size="sm">
            Apply
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clear} aria-label="Clear">
            <IconFilterOff size={14} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <a href={exportHref}>
          <Button type="button" variant="secondary" size="sm">
            <IconDownload size={14} /> Export CSV
          </Button>
        </a>
      </div>
    </form>
  );
}
