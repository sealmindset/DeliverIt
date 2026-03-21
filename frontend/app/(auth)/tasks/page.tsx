"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import type {
  Task,
  TaskCreate,
  Project,
  User,
} from "@/lib/types";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { TaskStatusBadge } from "@/components/task-status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { DeadlineIndicator } from "@/components/deadline-indicator";
import { useAuth } from "@/lib/auth";
import { progressPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { type ColumnDef } from "@tanstack/react-table";

const STATUS_OPTIONS = [
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "in_progress" },
  { label: "In Review", value: "in_review" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Critical", value: "critical" },
];

function CreateTaskDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      apiGet<Project[]>("/projects").then(
        (res) => setProjects(res)
      ).catch(() => {});
      apiGet<User[]>("/users").then(
        (res) => setUsers(res)
      ).catch(() => {});
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    setSubmitting(true);
    try {
      const body: TaskCreate = {
        title: title.trim(),
        description: description.trim(),
        project_id: projectId,
        priority: priority as TaskCreate["priority"],
        deadline: deadline || undefined,
        assignee_id: assigneeId || undefined,
      };
      await apiPost("/tasks", body);
      setTitle("");
      setDescription("");
      setProjectId("");
      setPriority("medium");
      setDeadline("");
      setAssigneeId("");
      onClose();
      onCreated();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-[var(--card-foreground)]">
          Create Task
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Task description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">Select project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--input)] px-4 py-2 text-sm hover:bg-[var(--accent)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !projectId}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { hasPermission } = useAuth();
  const router = useRouter();

  const fetchTasks = () => {
    setLoading(true);
    apiGet<Task[]>("/tasks")
      .then((res) => setTasks(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Build dynamic filter options from data
  const projectOptions = useMemo(() => {
    const unique = [...new Set(tasks.map((t) => t.project_name).filter(Boolean))] as string[];
    return unique.map((name) => ({ label: name, value: name }));
  }, [tasks]);

  const assigneeOptions = useMemo(() => {
    const unique = [
      ...new Set(tasks.map((t) => t.assignee_name).filter(Boolean)),
    ] as string[];
    return unique.map((name) => ({ label: name, value: name }));
  }, [tasks]);

  const columns: ColumnDef<Task, unknown>[] = useMemo(
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
        accessorKey: "project_name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Project" />
        ),
        filterFn: "equals",
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
        filterFn: "equals",
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
          if (total === 0)
            return (
              <span className="text-xs text-[var(--muted-foreground)]">
                --
              </span>
            );
          const completed = t.checklist_items.filter((i) => i.is_completed).length;
          const pct = progressPercent(completed, total);
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--secondary)]">
                <div
                  className={cn(
                    "h-full rounded-full",
                    pct === 100
                      ? "bg-[var(--success)]"
                      : "bg-[var(--primary)]"
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Tasks</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            All tasks across projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton resource="tasks" />
          {hasPermission("tasks", "create") && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Task
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tasks}
        searchKey="title"
        searchPlaceholder="Search tasks..."
        filterableColumns={[
          { id: "project_name", title: "Project", options: projectOptions },
          { id: "status", title: "Status", options: STATUS_OPTIONS },
          { id: "priority", title: "Priority", options: PRIORITY_OPTIONS },
          { id: "assignee_name", title: "Assignee", options: assigneeOptions },
        ]}
        storageKey="tasks"
        onRowClick={(row) => router.push(`/tasks/${row.id}`)}
      />

      <CreateTaskDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchTasks}
      />
    </div>
  );
}
