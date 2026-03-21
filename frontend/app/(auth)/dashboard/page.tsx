"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type {
  DashboardData,
  DashboardAtRiskTask,
  DashboardTasksByStatus,
  DashboardActivity,
} from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils";
import { DeadlineIndicator } from "@/components/deadline-indicator";
import { PriorityBadge } from "@/components/priority-badge";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { ExportButton } from "@/components/export-button";

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--muted-foreground)]">
          {title}
        </span>
        <span className={accent || "text-[var(--muted-foreground)]"}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-3xl font-bold text-[var(--card-foreground)]">
        {value}
      </div>
    </div>
  );
}

function StatusBar({
  items,
}: {
  items: DashboardTasksByStatus[];
}) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (total === 0) return null;

  const colors: Record<string, string> = {
    todo: "bg-[var(--secondary-foreground)]/20",
    in_progress: "bg-[var(--primary)]",
    in_review: "bg-[var(--warning)]",
    blocked: "bg-[var(--destructive)]",
    done: "bg-[var(--success)]",
  };

  const labels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    blocked: "Blocked",
    done: "Done",
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
      <h3 className="mb-4 font-semibold text-[var(--card-foreground)]">
        Tasks by Status
      </h3>
      <div className="flex h-8 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
        {items.map((item) => {
          const pct = (item.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={item.status}
              className={`${colors[item.status] || "bg-[var(--muted)]"} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${labels[item.status] || item.status}: ${item.count}`}
            />
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-4">
        {items.map((item) => (
          <div key={item.status} className="flex items-center gap-2 text-sm">
            <div
              className={`h-3 w-3 rounded-full ${colors[item.status] || "bg-[var(--muted)]"}`}
            />
            <span className="text-[var(--muted-foreground)]">
              {labels[item.status] || item.status}
            </span>
            <span className="font-medium text-[var(--card-foreground)]">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AtRiskList({ tasks }: { tasks: DashboardAtRiskTask[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] p-4">
        <h3 className="font-semibold text-[var(--card-foreground)]">
          Tasks at Risk
        </h3>
        <p className="text-xs text-[var(--muted-foreground)]">
          Due within 3 days or overdue
        </p>
      </div>
      {tasks.length === 0 ? (
        <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">
          No tasks at risk. Looking good!
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[var(--card-foreground)]">
                    {task.title}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {task.project_name}
                  {task.assignee_name && ` - ${task.assignee_name}`}
                </span>
              </div>
              <DeadlineIndicator deadline={task.deadline} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityList({ activities }: { activities: DashboardActivity[] }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="border-b border-[var(--border)] p-4">
        <h3 className="font-semibold text-[var(--card-foreground)]">
          Recent Activity
        </h3>
      </div>
      {activities.length === 0 ? (
        <div className="p-6 text-center text-sm text-[var(--muted-foreground)]">
          No recent activity.
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-4">
              <Activity className="mt-0.5 h-4 w-4 text-[var(--muted-foreground)]" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[var(--card-foreground)]">
                  {a.description}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>{a.user_name}</span>
                  <span>-</span>
                  <span>{formatRelative(a.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardData>("/dashboard")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center text-[var(--destructive)]">
        Failed to load dashboard: {error || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Project health and task overview
          </p>
        </div>
        <ExportButton resource="dashboard" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={data.stats.total_projects}
          icon={<FolderKanban className="h-5 w-5" />}
          accent="text-[var(--primary)]"
        />
        <StatCard
          title="Active Tasks"
          value={data.stats.active_tasks}
          icon={<CheckSquare className="h-5 w-5" />}
          accent="text-[var(--primary)]"
        />
        <StatCard
          title="Overdue Tasks"
          value={data.stats.overdue_tasks}
          icon={<AlertCircle className="h-5 w-5" />}
          accent="text-[var(--destructive)]"
        />
        <StatCard
          title="Completion Rate"
          value={`${data.stats.completion_rate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="text-[var(--success)]"
        />
      </div>

      {/* Status Bar */}
      <StatusBar items={data.tasks_by_status} />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AtRiskList tasks={data.at_risk_tasks} />
        <ActivityList activities={data.recent_activity} />
      </div>
    </div>
  );
}
