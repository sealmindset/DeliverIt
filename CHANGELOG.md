# Changelog

All notable changes to DeliverIt will be documented in this file.

## [0.2.0] - 2026-03-20

### Added
- Export reports to CSV and PDF from Dashboard, Projects, and Tasks pages
- Export dropdown button with CSV and PDF options on each page
- Backend export endpoints: /api/export/tasks/{csv|pdf}, /api/export/projects/{csv|pdf}, /api/export/dashboard/{csv|pdf}
- PDF reports with styled tables using reportlab
- Dashboard export includes overview metrics and at-risk tasks
- Projects export includes completion percentages
- Tasks export includes all columns (project, status, priority, assignee, deadline, checklist progress)

## [0.1.0] - 2026-03-13

### Added
- Initial project setup with Next.js 15 frontend and FastAPI backend
- OIDC authentication with Azure AD (mock-oidc for local development)
- Database-driven RBAC with 4 system roles (Super Admin, Admin, Manager, User)
- Task board with assignments, deadlines, and status tracking
- Readiness checklists -- mandatory completion before closing tasks
- Multi-project support with per-project task organization
- Manager dashboard with project health, deadlines at risk, completion rates
- Two-way Jira sync integration
- User Management and Role Management admin pages
- Standard UI components (Breadcrumbs, DataTable, QuickSearch, ModeToggle)
- Docker Compose development environment with mock services
- Seed data for immediate exploration
