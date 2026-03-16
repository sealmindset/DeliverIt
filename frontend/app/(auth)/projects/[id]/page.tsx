"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";
import type { Project, ProjectUpdate, Task } from "@/lib/types";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { TaskStatusBadge } from "@/components/task-status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { DeadlineIndicator } from "@/components/deadline-indicator";
import { useAuth } from "@/lib/auth";
import { formatDate, progressPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table";
import {
  FolderKanban,
  Edit2,
  ExternalLink,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "On Hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
  { label: "Archived", value: "archived" },
];

const TASK_STATUS_OPTIONS = [
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "In Review", value: "in_review" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
];

const TASK_PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGet<Project>(`/projects/${id}`),
      apiGet<Task[]>(`/tasks?project_id=${id}`),
    ])
      .then(([proj, taskRes]) => {
        setProject(proj);
        setTasks(taskRes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEdit = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDesc(project.description ?? "");
    setEditStatus(project.status);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!project) return;
    setSaving(true);
    try {
      const body: ProjectUpdate = {
        name: editName.trim(),
        description: editDesc.trim(),
        status: editStatus as ProjectUpdate["status"],
      };
      const updated = await apiPut<Project>(`/projects/${id}`, body);
      setProject(updated);
      setEditing(false);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const taskColumns: ColumnDef<Task, unknown>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Title" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("title")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <TaskStatusBadge status={row.getValue("status")} />
        ),
        filterFn: "equals",
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Priority" />
        ),
        cell: ({ row }) => (
          <PriorityBadge priority={row.getValue("priority")} />
        ),
        filterFn: "equals",
      },
      {
        accessorKey: "assignee_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assignee" />
        ),
        cell: ({ row }) => (
          <span className="text-sm">
            {row.getValue("assignee_name") || "Unassigned"}
          </span>
        ),
      },
      {
        accessorKey: "deadline",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Deadline" />
        ),
        cell: ({ row }) => (
          <DeadlineIndicator
            deadline={row.getValue("deadline")}
            status={row.original.status}
          />
        ),
      },
      {
        id: "checklist",
        header: "Checklist",
        cell: ({ row }) => {
          const t = row.original;
          const total = t.checklist_items.length;
          if (total === 0) return <span className="text-xs text-[var(--muted-foreground)]">--</span>;
          const completed = t.checklist_items.filter((i) => i.is_completed).length;
          const pct = progressPercent(completed, total);
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className={cn(
                    "h-full rounded-full",
                    pct === 100 ? "bg-[var(--success)]" : "bg-[var(--primary)]"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">
                {completed}/{total}
              </span>
            </div>
          );
        },
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center text-[var(--destructive)]">
        Project not found.
      </div>
    );
  }

  const completedTaskCount = tasks.filter((t) => t.status === "done").length;
  const pct = progressPercent(completedTaskCount, project.task_count);
  const statusColor: Record<string, string> = {
    active: "bg-[var(--success)]/15 text-[var(--success)]",
    on_hold: "bg-[var(--warning)]/15 text-[var(--warning)]",
    completed: "bg-[var(--primary)]/15 text-[var(--primary)]",
    archived: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
        {editing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--input)] px-3 py-2 text-sm hover:bg-[var(--accent)]"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FolderKanban className="h-6 w-6 text-[var(--primary)]" />
                <div>
                  <h1 className="text-2xl font-bold text-[var(--card-foreground)]">
                    {project.name}
                  </h1>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {project.description || "No description"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    statusColor[project.status] || ""
                  )}
                >
                  {project.status.replace("_", " ")}
                </span>
                {hasPermission("projects", "edit") && (
                  <button
                    onClick={startEdit}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--input)] px-3 py-1.5 text-sm hover:bg-[var(--accent)]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>
                    {completedTaskCount} of {project.task_count}{" "}
                    tasks completed
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Jira sync */}
            {project.jira_project_key && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 text-[var(--muted-foreground)]" />
                <span className="text-[var(--muted-foreground)]">
                  Jira: {project.jira_project_key}
                </span>
              </div>
            )}

            <div className="mt-2 text-xs text-[var(--muted-foreground)]">
              Created {formatDate(project.created_at)}
            </div>
          </>
        )}
      </div>

      {/* Tasks */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Tasks
        </h2>
        <DataTable
          columns={taskColumns}
          data={tasks}
          searchKey="title"
          searchPlaceholder="Search tasks..."
          filterableColumns={[
            { id: "status", title: "Status", options: TASK_STATUS_OPTIONS },
            {
              id: "priority",
              title: "Priority",
              options: TASK_PRIORITY_OPTIONS,
            },
          ]}
          storageKey={`project-${id}-tasks`}
          onRowClick={(row) => router.push(`/tasks/${row.id}`)}
        />
      </div>
    </div>
  );
}
