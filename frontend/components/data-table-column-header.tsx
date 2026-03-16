"use client";

import { type Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={() => column.toggleSorting(sorted === "asc")}
        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider hover:text-[var(--foreground)] transition-colors -ml-2 px-2 py-1 rounded"
      >
        {title}
        {sorted === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : sorted === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
      <button
        onClick={() => column.toggleVisibility(false)}
        className="ml-auto opacity-0 group-hover:opacity-100 hover:text-[var(--foreground)] transition-opacity"
        title={`Hide ${title}`}
      >
        <EyeOff className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
