"use client";
import * as React from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = React.useMemo(() => {
    const arr: (number | "…")[] = [];
    const push = (n: number | "…") => arr.push(n);
    const window = 1;
    for (let i = 1; i <= pageCount; i++) {
      if (i === 1 || i === pageCount || (i >= page - window && i <= page + window)) push(i);
      else if (arr[arr.length - 1] !== "…") push("…");
    }
    return arr;
  }, [page, pageCount]);

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)] disabled:opacity-40"
        aria-label="Previous"
      >
        <IconChevronLeft size={14} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-[var(--color-muted)] text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm transition-colors",
              p === page
                ? "bg-[var(--color-dark)] text-white"
                : "border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)] disabled:opacity-40"
        aria-label="Next"
      >
        <IconChevronRight size={14} />
      </button>
    </nav>
  );
}
