# DeliverIt

A task tracking application that keeps teams focused and accountable. DeliverIt enforces mandatory readiness checklists before tasks can be closed and provides two-way Jira synchronization to keep work aligned across tools.

Built for internal teams of 10-50 people who need visibility into project health, deadline risks, and task completion -- without the overhead of enterprise project management suites.

---

## Features

### Task Management
- **Task board** with assignments, deadlines, status tracking, and priority levels
- **Multi-project support** with per-project task organization and progress tracking
- **Deadline tracking** with overdue and at-risk indicators so nothing slips through

### Readiness Checklists
- **Mandatory checklists** attached to tasks -- every checklist item must be completed before a task can be closed
- Ensures quality gates are met before work is marked done
- Configurable per task type

### Manager Dashboard
- **Project health overview** with completion rates and trend data
- **Deadlines at risk** surfaced at a glance
- Task distribution across team members
- Real metrics from seed data on first launch -- no empty screens

### Jira Integration
- **Two-way sync** between DeliverIt and Jira
- Projects, tasks, status, and assignees stay aligned across both systems
- Sync status visible on project detail pages

### Role-Based Access Control
- **4 system roles** with granular, database-driven permissions:

| Role | Capabilities |
|------|-------------|
| Super Admin | Full system access. Manage users, roles, and custom permission sets |
| Admin | Application administration and user management |
| Manager | Assign tasks, set deadlines, view dashboards, manage projects |
| User | View assigned tasks, update status, complete readiness checklists |

- **21 page-level CRUD permissions** across 6 resource areas (dashboard, projects, tasks, checklists, users, roles)
- Super Admins can create custom roles with any permission combination via the permission matrix editor
- Sidebar navigation and action buttons adapt based on the logged-in user's permissions

### Administration
- **User Management** -- provision users from your identity provider, assign roles, deactivate accounts
- **Role Management** -- create custom roles, edit permissions through a visual matrix editor
- System roles (Super Admin, Admin, Manager, User) cannot be deleted

---

## Architecture

```
                    +-----------------+
                    |   Next.js 15    |
                    |   Frontend      |
                    |   (TypeScript)  |
                    +--------+--------+
                             |
                       /api/* proxy
                             |
                    +--------v--------+
                    |    FastAPI      |
                    |    Backend      |
                    |   (Python 3.12) |
                    +----+-------+----+
                         |       |
              +----------+       +----------+
              |                             |
     +--------v--------+          +--------v--------+
     |  PostgreSQL 16   |          |   Jira REST API  |
     |  (RBAC + Data)   |          |  (bidirectional)  |
     +-----------------+          +-----------------+
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.12, Pydantic, SQLAlchemy |
| Database | PostgreSQL 16, Alembic migrations |
| Authentication | OIDC (Azure AD in production) with stateless JWT |
| UI Components | TanStack React Table v8, next-themes, oklch color system |
| Containerization | Docker, Docker Compose |

### Standard UI Components

Every page includes these built-in components:

- **Breadcrumbs** -- auto-generated from URL path with human-readable segment labels
- **DataTable** -- Excel-style column filters, multi-select, comparison operators, sorting, grouping, pagination with localStorage persistence
- **QuickSearch** -- Cmd+K / Ctrl+K command palette for instant navigation
- **ModeToggle** -- light / dark / system theme toggle

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/dashboard` | Project health overview, deadlines at risk, task completion rates |
| Projects | `/projects` | All projects with status, progress bars, and team count |
| Project Detail | `/projects/[id]` | Tasks within a project, team members, Jira sync status |
| Tasks | `/tasks` | All tasks across projects with filters by project, assignee, status, deadline |
| Task Detail | `/tasks/[id]` | Full task view with readiness checklist, Jira link, history |
| User Management | `/admin/users` | Add, edit, deactivate users and assign roles |
| Role Management | `/admin/roles` | Create custom roles, permission matrix editor |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health check |
| GET | `/api/auth/login` | Initiate OIDC login flow |
| GET | `/api/auth/callback` | OIDC callback (exchanges code for JWT) |
| GET | `/api/auth/me` | Current user profile and permissions |
| POST | `/api/auth/logout` | Clear JWT cookie |
| GET | `/api/dashboard` | Dashboard metrics and project health |
| GET | `/api/projects` | List all projects |
| GET | `/api/projects/{id}` | Project detail with tasks |
| POST | `/api/projects` | Create a project |
| PUT | `/api/projects/{id}` | Update a project |
| DELETE | `/api/projects/{id}` | Delete a project |
| GET | `/api/tasks` | List all tasks (filterable) |
| GET | `/api/tasks/{id}` | Task detail with checklist |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/{id}` | Update a task |
| DELETE | `/api/tasks/{id}` | Delete a task |
| GET | `/api/checklists` | List checklists |
| GET | `/api/checklists/{id}` | Checklist detail |
| POST | `/api/checklists` | Create a checklist |
| PUT | `/api/checklists/{id}` | Update a checklist |
| GET | `/api/jira/projects` | List synced Jira projects |
| GET | `/api/jira/issues` | List synced Jira issues |
| POST | `/api/jira/sync/{task_id}` | Trigger Jira sync for a task |
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | User detail |
| POST | `/api/users` | Create a user |
| PUT | `/api/users/{id}` | Update a user |
| GET | `/api/roles` | List all roles |
| GET | `/api/roles/{id}` | Role detail with permissions |
| POST | `/api/roles` | Create a custom role |
| PUT | `/api/roles/{id}` | Update a role |
| GET | `/api/permissions` | List all permissions |

All endpoints (except `/health`, `/api/auth/login`, and `/api/auth/callback`) require a valid JWT and are protected by `require_permission(resource, action)` middleware.

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/sealmindset/DeliverIt.git
cd DeliverIt

# Generate a JWT secret
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
echo "OIDC_CLIENT_ID=mock-oidc-client" >> .env
echo "OIDC_CLIENT_SECRET=mock-oidc-secret" >> .env

# Start the application with mock services
docker compose --profile dev up -d

# Seed mock-oidc with test users and redirect URIs
bash scripts/seed-mock-services.sh
```

The application is now running:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3002 |
| Backend API | http://localhost:8002 |
| Mock OIDC | http://localhost:3009 |
| Mock Jira | http://localhost:8443 |

### Test Users

When you click login, the mock OIDC provider presents a user picker. Each user maps to a role with different permissions:

| User | Role | Email |
|------|------|-------|
| Alex Admin | Super Admin | admin@example.com |
| Morgan Manager | Manager | manager@example.com |
| Sam Analyst | Admin | analyst@example.com |
| Pat User | User | user@example.com |

### Seed Data

The application starts with realistic sample data so every page is populated on first launch:

- **4 users** (one per role, matching mock-oidc test accounts)
- **3 projects** with varying completion status
- **20 tasks** with assignments, deadlines, priorities, and statuses
- **4 system roles** with 21 page-level CRUD permissions
- **Readiness checklists** attached to tasks

---

## Project Structure

```
DeliverIt/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── config.py               # Environment-based configuration
│   │   ├── database.py             # Async SQLAlchemy engine + session
│   │   ├── middleware/
│   │   │   ├── auth.py             # JWT validation, get_current_user
│   │   │   └── permissions.py      # require_permission(resource, action)
│   │   ├── models/                 # SQLAlchemy models (user, role, project, task, etc.)
│   │   ├── routers/                # API route handlers
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   └── services/               # Business logic (Jira client, permission cache)
│   ├── alembic/
│   │   └── versions/
│   │       ├── 001_initial_schema.py          # All tables
│   │       ├── 002_seed_roles_permissions.py  # System roles + CRUD permissions
│   │       └── 003_seed_data.py               # Sample projects, tasks, users
│   ├── entrypoint.sh               # Waits for DB, runs migrations, starts server
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── (auth)/                 # Authenticated route group
│   │   │   ├── dashboard/          # Dashboard page
│   │   │   ├── projects/           # Projects list + detail
│   │   │   ├── tasks/              # Tasks list + detail
│   │   │   ├── admin/users/        # User management
│   │   │   ├── admin/roles/        # Role management
│   │   │   └── layout.tsx          # Shared layout (sidebar, header bar)
│   │   ├── layout.tsx              # Root layout (ThemeProvider)
│   │   └── page.tsx                # Login page
│   ├── components/                 # Reusable UI (DataTable, Breadcrumbs, QuickSearch, etc.)
│   ├── lib/                        # API client, auth helpers, types
│   ├── next.config.ts              # Same-origin proxy (/api/* -> backend)
│   └── Dockerfile
├── mock-services/
│   ├── mock-oidc/                  # Python OIDC provider (RSA signing, user picker, admin API)
│   └── mock-jira/                  # Node.js Jira REST API simulator
├── scripts/
│   └── seed-mock-services.sh       # Register users, set redirect URIs, verify mocks
├── docker-compose.yml              # 5 services (frontend, backend, db, mock-oidc, mock-jira)
├── .env.example                    # Environment variable documentation
├── .make-it/
│   └── app-context.json            # Application design decisions
└── .make-it-state.md               # Build state breadcrumb
```

---

## Authentication Flow

DeliverIt uses OpenID Connect for authentication. In production, this connects to Azure AD. For local development, a mock OIDC provider simulates the same flow.

```
Browser                    Frontend           Backend            OIDC Provider
  │                           │                  │                    │
  │  Click "Login"            │                  │                    │
  │──────────────────────────>│                  │                    │
  │                           │  /api/auth/login │                    │
  │                           │─────────────────>│                    │
  │                           │                  │  302 Redirect      │
  │  Redirect to OIDC         │                  │───────────────────>│
  │<──────────────────────────────────────────────                    │
  │                           │                  │                    │
  │  Select user / enter credentials             │                    │
  │──────────────────────────────────────────────────────────────────>│
  │                           │                  │                    │
  │  302 callback?code=xxx    │                  │                    │
  │<─────────────────────────────────────────────────────────────────│
  │                           │                  │                    │
  │  /api/auth/callback       │                  │                    │
  │──────────────────────────>│─────────────────>│                    │
  │                           │                  │  Exchange code     │
  │                           │                  │───────────────────>│
  │                           │                  │  id_token + access │
  │                           │                  │<──────────────────│
  │                           │                  │                    │
  │                           │                  │  Lookup user in DB │
  │                           │                  │  (by oidc_subject) │
  │                           │                  │  Read role from DB │
  │                           │                  │                    │
  │                           │                  │  Sign JWT with:    │
  │                           │                  │  {sub, email, name,│
  │                           │                  │   role_id,         │
  │                           │                  │   role_name,       │
  │                           │                  │   permissions[]}   │
  │                           │                  │                    │
  │  Set httpOnly JWT cookie  │                  │                    │
  │<──────────────────────────────────────────────                    │
  │                           │                  │                    │
  │  Redirect to /dashboard   │                  │                    │
  │──────────────────────────>│                  │                    │
```

Key design decisions:
- **Roles come from the application database**, not the OIDC provider -- this allows role management without touching the identity provider
- **Stateless JWT** -- no server-side session store needed. The JWT contains the user's role and permissions.
- **Same-origin proxy** -- the frontend proxies `/api/*` requests to the backend, so auth cookies are always first-party
- **Logout is POST** -- clears the httpOnly JWT cookie via a backend API call

---

## Environment Configuration

All configuration is through environment variables. No hardcoded URLs, secrets, or service addresses in application code.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `openssl rand -hex 32` |
| `OIDC_ISSUER_URL` | OIDC provider discovery URL | `https://login.microsoftonline.com/{tenant}/v2.0` |
| `OIDC_CLIENT_ID` | OIDC application client ID | `your-client-id` |
| `OIDC_CLIENT_SECRET` | OIDC application client secret | `your-client-secret` |
| `FRONTEND_URL` | Frontend base URL (for CORS and redirects) | `https://deliverit.example.com` |
| `BACKEND_URL` | Backend base URL | `https://api.deliverit.example.com` |
| `JIRA_BASE_URL` | Jira instance URL | `https://your-org.atlassian.net` |
| `JIRA_AUTH_TOKEN` | Jira API authentication token | `your-jira-token` |

For local development, `.env` is loaded automatically. See `.env.example` for the full list with documentation.

---

## Database Migrations

DeliverIt uses Alembic for database schema management. Migrations run automatically on container startup via `entrypoint.sh`.

| Migration | Description |
|-----------|-------------|
| `001_initial_schema` | All tables: users, roles, permissions, role_permissions, projects, tasks, checklists, jira_sync |
| `002_seed_roles_permissions` | 4 system roles, 21 page-level CRUD permissions, default role-permission mappings |
| `003_seed_data` | Sample users, projects, tasks, and checklists for immediate exploration |

To run migrations manually:

```bash
docker compose exec backend alembic upgrade head
```

---

## Production Deployment

DeliverIt is containerized and designed to deploy to any cloud provider that supports Docker containers. The application was deployed to AWS using the [/ship-it](https://github.com/sealmindset/ship-it) framework, which automates the path from local code to a production pull request.

### AWS Architecture

| AWS Service | Purpose |
|-------------|---------|
| ECR | Docker image registry for backend and frontend containers |
| ECS Fargate | Serverless container orchestration |
| RDS PostgreSQL | Managed database |
| Secrets Manager | JWT_SECRET, database credentials, OIDC configuration |
| CloudWatch | Application logs |
| ALB | Load balancing and HTTPS termination |

### Deployment Flow

The deployment pipeline is fully automated:

1. Developer runs `/ship-it` -- creates a branch, commits code, generates a GitHub Actions workflow, opens a PR
2. GitHub Actions builds Docker images and pushes to ECR
3. CI/CD automation scans the PR for security, compliance, and infrastructure issues
4. Auto-remediation fixes what it can; DevOps handles the rest
5. After all checks pass, ECS services are updated with the new images
6. Health checks confirm the deployment is healthy

The only environment differences between local development and production are the environment variables -- the same Docker images run in both places.

---

## How This App Was Built

DeliverIt was created using the [/make-it](https://github.com/sealmindset/make-it) framework -- a Claude Code skill that takes a plain-English app description and generates a fully working, production-ready application. No programming knowledge was required.

The build process:
1. Described the app idea in plain English ("a task tracker with readiness checklists and Jira sync")
2. Answered conversational questions about users, features, and roles
3. `/make-it` made all technical decisions and generated the complete application
4. `/make-it` verified everything worked (auth, API, pages, permissions, seed data)
5. `/ship-it` deployed it to AWS

The entire application -- backend, frontend, database schema, migrations, seed data, mock services, Docker configuration, and RBAC system -- was generated from a conversation.

---

## License

See [LICENSE](LICENSE) for details.
