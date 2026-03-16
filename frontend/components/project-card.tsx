"use client";

import Link from "next/link";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-[var(--success)]/15 text-[var(--success)]",
  on_hold: "bg-[var(--warning)]/15 text-[var(--warning)]",
  completed: "bg-[var(--primary)]/15 text-[var(--primary)]",
  archived: "bg-[var(--muted)] text-[var(--muted-foreground)]",
};

export function ProjectCard({ project }: { project: Project }) {
  const pct = 0; // Backend does not provide completed_tasks_count; progress unavailable in card view

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--card-foreground)]">
            {project.name}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            STATUS_COLORS[project.status] || STATUS_COLORS.active
          )}
        >
          {project.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted-foreground)]">
        {project.description || "No description"}
      </p>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
          <span>
            {project.task_count} tasks
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
