"use client";

import { type Table } from "@tanstack/react-table";
import { X, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface FilterableColumn {
  id: string;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filterableColumns?: FilterableColumn[];
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Search...",
  filterableColumns = [],
}: DataTableToolbarProps<TData>) {
  const [showColumns, setShowColumns] = useState(false);
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        {searchKey && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(e) =>
                table.getColumn(searchKey)?.setFilterValue(e.target.value)
              }
              className="h-9 w-full rounded-md border border-[var(--input)] bg-transparent pl-9 pr-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        )}
        {filterableColumns.map((fc) => {
          const column = table.getColumn(fc.id);
          if (!column) return null;
          const filterValue = (column.getFilterValue() as string) ?? "";
          return (
            <select
              key={fc.id}
              value={filterValue}
              onChange={(e) =>
                column.setFilterValue(e.target.value || undefined)
              }
              className="h-9 rounded-md border border-[var(--input)] bg-transparent px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">All {fc.title}</option>
              {fc.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          );
        })}
        {isFiltered && (
          <button
            onClick={() => table.resetColumnFilters()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            Reset
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowColumns(!showColumns)}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--input)] px-3 h-9 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Columns
        </button>
        {showColumns && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowColumns(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-[var(--border)] bg-[var(--popover)] p-2 shadow-md">
              {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-[var(--accent)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={column.getIsVisible()}
                    onChange={(e) => column.toggleVisibility(e.target.checked)}
                    className="rounded"
                  />
                  <span className="capitalize">
                    {column.id.replace(/_/g, " ")}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
