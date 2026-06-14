"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * URL-driven prev/next pagination. Server page reads `?page=` and
 * queries the DB with the correct skip/take. We render Link components
 * so prefetching + back-button history work out of the box.
 */
export function AuditPagination({
  page,
  pageCount,
  total,
}: {
  page: number;
  pageCount: number;
  total: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (pageCount <= 1) {
    return (
      <p className="text-xs text-[var(--color-muted)]">
        {total} event{total === 1 ? "" : "s"}
      </p>
    );
  }

  const href = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    return `${pathname}?${next.toString()}`;
  };

  const canPrev = page > 1;
  const canNext = page < pageCount;

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-[var(--color-muted)]">
        Page {page} of {pageCount} · {total.toLocaleString()} event
        {total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={canPrev ? href(page - 1) : "#"}
          aria-disabled={!canPrev}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)]",
            !canPrev && "pointer-events-none opacity-40"
          )}
          aria-label="Previous page"
        >
          <IconChevronLeft size={14} />
        </Link>
        <Link
          href={canNext ? href(page + 1) : "#"}
          aria-disabled={!canNext}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)]",
            !canNext && "pointer-events-none opacity-40"
          )}
          aria-label="Next page"
        >
          <IconChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
