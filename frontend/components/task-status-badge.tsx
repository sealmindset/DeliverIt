"use client";

import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: {
    label: "To Do",
    className:
      "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-[var(--primary)]/15 text-[var(--primary)]",
  },
  in_review: {
    label: "In Review",
    className: "bg-[var(--warning)]/15 text-[var(--warning)]",
  },
  blocked: {
    label: "Blocked",
    className: "bg-[var(--destructive)]/15 text-[var(--destructive)]",
  },
  done: {
    label: "Done",
    className: "bg-[var(--success)]/15 text-[var(--success)]",
  },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
