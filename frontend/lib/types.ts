// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  oidc_subject: string;
  email: string;
  display_name: string;
  is_active: boolean;
  role_id: string;
  role_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthMe {
  sub: string;
  email: string;
  name: string;
  role_id: string;
  role_name: string;
  permissions: string[];
}

// ── Roles & Permissions ─────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

// ── Projects ────────────────────────────────────────────────────────────────

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  jira_project_key: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  task_count: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: ProjectStatus;
  jira_project_key?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  jira_project_key?: string;
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "done";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  project_id: string;
  project_name: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  created_by_id: string;
  jira_key: string | null;
  jira_sync_status: string | null;
  checklist_items: ChecklistItem[];
  checklist_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string;
  project_id: string;
  assignee_id?: string;
  jira_key?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  deadline?: string | null;
  assignee_id?: string | null;
  jira_key?: string;
}

// ── Checklist ───────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  completed_by_id: string | null;
  completed_by_name: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface ChecklistItemCreate {
  title: string;
  sort_order?: number;
}

export interface ChecklistItemUpdate {
  title?: string;
  is_completed?: boolean;
  sort_order?: number;
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_projects: number;
  active_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
}

export interface DashboardTasksByStatus {
  status: TaskStatus;
  count: number;
}

export interface DashboardAtRiskTask {
  id: string;
  title: string;
  project_name: string;
  deadline: string;
  assignee_name: string | null;
  priority: TaskPriority;
}

export interface DashboardActivity {
  id: string;
  description: string;
  timestamp: string;
  user_name: string;
}

export interface DashboardData {
  stats: DashboardStats;
  tasks_by_status: DashboardTasksByStatus[];
  at_risk_tasks: DashboardAtRiskTask[];
  recent_activity: DashboardActivity[];
}

// ── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── OIDC Directory ──────────────────────────────────────────────────────────

export interface OidcDirectoryUser {
  oidc_subject: string;
  email: string;
  display_name: string;
}
