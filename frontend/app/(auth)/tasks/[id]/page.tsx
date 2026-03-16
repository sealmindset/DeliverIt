"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPut } from "@/lib/api";
import type {
  Task,
  TaskUpdate,
  ChecklistItem,
  User,
} from "@/lib/types";
import { ChecklistPanel } from "@/components/checklist-panel";
import { TaskStatusBadge } from "@/components/task-status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { DeadlineIndicator } from "@/components/deadline-indicator";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime, progressPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Edit2,
  Save,
  X,
  ExternalLink,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [markingDone, setMarkingDone] = useState(false);

  const fetchTask = useCallback(() => {
    return Promise.all([
      apiGet<Task>(`/tasks/${id}`),
      apiGet<ChecklistItem[]>(`/checklists?task_id=${id}`),
    ])
      .then(([t, cl]) => {
        setTask(t);
        setChecklist(cl);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchTask().finally(() => setLoading(false));
  }, [fetchTask]);

  useEffect(() => {
    if (editing) {
      apiGet<User[]>("/users")
        .then((res) => setUsers(res))
        .catch(() => {});
    }
  }, [editing]);

  const startEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description ?? "");
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDeadline(task.deadline ? task.deadline.split("T")[0] : "");
    setEditAssigneeId(task.assignee_id || "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const body: TaskUpdate = {
        title: editTitle.trim(),
        description: editDesc.trim(),
        status: editStatus as TaskUpdate["status"],
        priority: editPriority as TaskUpdate["priority"],
        deadline: editDeadline || null,
        assignee_id: editAssigneeId || null,
      };
      const updated = await apiPut<Task>(`/tasks/${id}`, body);
      setTask(updated);
      setEditing(false);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const markAsDone = async () => {
    setMarkingDone(true);
    try {
      const updated = await apiPut<Task>(`/tasks/${id}`, {
        status: "done",
      });
      setTask(updated);
    } catch {
      // handle error
    } finally {
      setMarkingDone(false);
    }
  };

  const onChecklistUpdate = () => {
    fetchTask();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="py-20 text-center text-[var(--destructive)]">
        Task not found.
      </div>
    );
  }

  const allChecklistDone =
    checklist.length > 0 && checklist.every((i) => i.is_completed);
  const canMarkDone =
    task.status !== "done" &&
    (checklist.length === 0 || allChecklistDone) &&
    hasPermission("tasks", "edit");

  const checklistDisabledReason =
    task.status === "done"
      ? null
      : checklist.length > 0 && !allChecklistDone
        ? `Complete all ${checklist.length - checklist.filter((i) => i.is_completed).length} remaining checklist items before marking as done`
        : null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tasks
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Header */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
            {editing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Priority
                    </label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
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
                    <label className="block text-sm font-medium mb-1">
                      Assignee
                    </label>
                    <select
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
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
                    <label className="block text-sm font-medium mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full rounded-md border border-[var(--input)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                </div>
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
                  <h1 className="text-2xl font-bold text-[var(--card-foreground)]">
                    {task.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    {hasPermission("tasks", "edit") && (
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
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                {task.description && (
                  <p className="mt-4 text-sm text-[var(--muted-foreground)] whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Checklist */}
          <ChecklistPanel
            taskId={id}
            items={checklist}
            onUpdate={onChecklistUpdate}
            canEdit={hasPermission("checklists", "edit")}
          />
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          {/* Mark as Done */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <button
              onClick={markAsDone}
              disabled={!canMarkDone || markingDone}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                canMarkDone
                  ? "bg-[var(--success)] text-[var(--success-foreground)] hover:opacity-90"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
              )}
            >
              <CheckCircle2 className="h-5 w-5" />
              {task.status === "done"
                ? "Already Done"
                : markingDone
                  ? "Marking..."
                  : "Mark as Done"}
            </button>
            {checklistDisabledReason && (
              <p className="mt-2 text-xs text-[var(--warning)]">
                {checklistDisabledReason}
              </p>
            )}
          </div>

          {/* Details Card */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 space-y-4">
            <h3 className="font-semibold text-[var(--card-foreground)]">
              Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Project</span>
                <Link
                  href={`/projects/${task.project_id}`}
                  className="font-medium text-[var(--primary)] hover:underline"
                >
                  {task.project_name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Assignee</span>
                <span className="font-medium">
                  {task.assignee_name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Deadline</span>
                <DeadlineIndicator
                  deadline={task.deadline}
                  status={task.status}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">
                  Checklist
                </span>
                <span className="font-medium">
                  {checklist.length === 0
                    ? "No items"
                    : `${checklist.filter((i) => i.is_completed).length}/${checklist.length}`}
                </span>
              </div>
              {task.jira_key && (
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted-foreground)]">Jira</span>
                  <span className="inline-flex items-center gap-1 font-medium text-[var(--primary)]">
                    {task.jira_key}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              )}
              <div className="border-t border-[var(--border)] pt-3">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Created
                  </span>
                  <span>{formatDate(task.created_at)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Updated</span>
                <span>{formatDateTime(task.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
