"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { IconChevronDown, IconChevronUp, IconSearch } from "@tabler/icons-react";
import { Input } from "./input";
import { Pagination } from "./pagination";
import { EmptyState } from "./state";
import { cn } from "@/lib/utils";

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** When set, renders a search input that filters the entire row globally. */
  searchPlaceholder?: string;
  /** Initial page size. Defaults to 10. */
  pageSize?: number;
  /** Optional empty state override. */
  empty?: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode };
}

/**
 * Generic, client-side TanStack Table wrapper. Use for moderate datasets
 * (≤ a few hundred rows in memory). For larger sets, swap the model fns
 * for the manual* equivalents and drive paging/sorting from the server.
 */
export function DataTable<T>({
  columns,
  data,
  searchPlaceholder,
  pageSize = 10,
  empty,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      {searchPlaceholder ? (
        <div className="relative max-w-xs">
          <IconSearch
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-9 text-[13px]"
          />
        </div>
      ) : null}

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-background)] text-left text-[11px] uppercase tracking-wider text-[var(--color-muted)] border-b border-[var(--color-border)]">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const canSort = h.column.getCanSort();
                    const sortDir = h.column.getIsSorted();
                    return (
                      <th key={h.id} className="px-4 py-2.5 font-medium align-middle">
                        {h.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={h.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)] transition-colors"
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {sortDir === "asc" ? (
                              <IconChevronUp size={12} />
                            ) : sortDir === "desc" ? (
                              <IconChevronDown size={12} />
                            ) : null}
                          </button>
                        ) : (
                          flexRender(h.column.columnDef.header, h.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12">
                    <EmptyState
                      title={empty?.title ?? "Nothing here yet"}
                      description={empty?.description}
                      action={empty?.action}
                      className="border-0 shadow-none surface-card !bg-transparent"
                    />
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn("transition-colors hover:bg-[var(--color-background)]")}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-middle text-[var(--color-foreground)]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {table.getPageCount() > 1 ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--color-muted)]">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ·{" "}
            {table.getFilteredRowModel().rows.length} result
            {table.getFilteredRowModel().rows.length === 1 ? "" : "s"}
          </p>
          <Pagination
            page={table.getState().pagination.pageIndex + 1}
            pageCount={table.getPageCount()}
            onPageChange={(p) => table.setPageIndex(p - 1)}
          />
        </div>
      ) : null}
    </div>
  );
}
