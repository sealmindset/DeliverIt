# Changelog

All notable changes to DeliverIt will be documented in this file.

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
