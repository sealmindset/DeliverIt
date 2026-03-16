"""Seed sample data -- users, projects, tasks, checklists

Revision ID: 003
Revises: 002
Create Date: 2026-03-13
"""

from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

# Role UUIDs from migration 002
ROLE_SUPER_ADMIN = "10000000-0000-0000-0000-000000000001"
ROLE_ADMIN = "10000000-0000-0000-0000-000000000002"
ROLE_MANAGER = "10000000-0000-0000-0000-000000000003"
ROLE_USER = "10000000-0000-0000-0000-000000000004"

# User UUIDs
USER_ADMIN = "30000000-0000-0000-0000-000000000001"
USER_MANAGER = "30000000-0000-0000-0000-000000000002"
USER_ANALYST = "30000000-0000-0000-0000-000000000003"
USER_REGULAR = "30000000-0000-0000-0000-000000000004"

# Project UUIDs
PROJ_PLATFORM = "40000000-0000-0000-0000-000000000001"
PROJ_MOBILE = "40000000-0000-0000-0000-000000000002"
PROJ_DATA = "40000000-0000-0000-0000-000000000003"

# Task UUIDs (20 tasks)
TASKS = [
    f"50000000-0000-0000-0000-{str(i).zfill(12)}" for i in range(1, 21)
]

# Checklist UUIDs (up to 5 per task = 100 slots)
def cl_id(task_idx: int, item_idx: int) -> str:
    n = (task_idx - 1) * 5 + item_idx
    return f"60000000-0000-0000-0000-{str(n).zfill(12)}"


def upgrade() -> None:
    # --- Users (matching mock-oidc subjects) ---
    op.execute(
        sa.text(
            "INSERT INTO users (id, oidc_subject, email, display_name, is_active, role_id) VALUES "
            f"('{USER_ADMIN}', 'mock-admin', 'admin@deliverit.local', 'Alex Admin', true, '{ROLE_SUPER_ADMIN}'), "
            f"('{USER_MANAGER}', 'mock-manager', 'manager@deliverit.local', 'Morgan Manager', true, '{ROLE_MANAGER}'), "
            f"('{USER_ANALYST}', 'mock-analyst', 'analyst@deliverit.local', 'Jamie Analyst', true, '{ROLE_ADMIN}'), "
            f"('{USER_REGULAR}', 'mock-user', 'user@deliverit.local', 'Sam User', true, '{ROLE_USER}') "
            "ON CONFLICT (id) DO NOTHING"
        )
    )

    # --- Projects ---
    op.execute(
        sa.text(
            "INSERT INTO projects (id, name, description, status, jira_project_key, created_by_id) VALUES "
            f"('{PROJ_PLATFORM}', 'Platform Upgrade', 'Migrate core platform to microservices architecture', 'active', 'PLAT', '{USER_ADMIN}'), "
            f"('{PROJ_MOBILE}', 'Mobile App v2', 'Complete redesign of the mobile experience with offline support', 'active', 'MOB', '{USER_MANAGER}'), "
            f"('{PROJ_DATA}', 'Data Pipeline', 'Build real-time data pipeline for analytics dashboard', 'on_hold', 'DATA', '{USER_ANALYST}') "
            "ON CONFLICT (id) DO NOTHING"
        )
    )

    # --- Tasks ---
    # We use realistic timestamps relative to "now" via SQL expressions
    # Some overdue (deadline in past), some at risk (deadline within 3 days), some future
    tasks_sql = (
        "INSERT INTO tasks (id, title, description, status, priority, deadline, project_id, assignee_id, created_by_id, jira_key) VALUES "
        # Platform Upgrade tasks (7)
        f"('{TASKS[0]}', 'Set up Kubernetes cluster', 'Configure EKS cluster with proper networking and RBAC', 'done', 'critical', NOW() - INTERVAL '5 days', '{PROJ_PLATFORM}', '{USER_ADMIN}', '{USER_ADMIN}', 'PLAT-1'), "
        f"('{TASKS[1]}', 'Containerize auth service', 'Dockerize the authentication microservice', 'done', 'high', NOW() - INTERVAL '3 days', '{PROJ_PLATFORM}', '{USER_ANALYST}', '{USER_ADMIN}', 'PLAT-2'), "
        f"('{TASKS[2]}', 'Migrate user database', 'Move user data to new PostgreSQL cluster', 'in_progress', 'critical', NOW() + INTERVAL '1 day', '{PROJ_PLATFORM}', '{USER_ADMIN}', '{USER_MANAGER}', 'PLAT-3'), "
        f"('{TASKS[3]}', 'Set up CI/CD pipelines', 'Configure GitHub Actions for all microservices', 'in_review', 'high', NOW() + INTERVAL '2 days', '{PROJ_PLATFORM}', '{USER_ANALYST}', '{USER_ADMIN}', 'PLAT-4'), "
        f"('{TASKS[4]}', 'API gateway configuration', 'Set up Kong API gateway with rate limiting', 'todo', 'medium', NOW() + INTERVAL '7 days', '{PROJ_PLATFORM}', '{USER_ADMIN}', '{USER_MANAGER}', 'PLAT-5'), "
        f"('{TASKS[5]}', 'Load testing', 'Run k6 load tests against new infrastructure', 'todo', 'medium', NOW() + INTERVAL '14 days', '{PROJ_PLATFORM}', '{USER_REGULAR}', '{USER_MANAGER}', NULL), "
        f"('{TASKS[6]}', 'Security audit', 'Complete security review of new architecture', 'blocked', 'critical', NOW() - INTERVAL '1 day', '{PROJ_PLATFORM}', '{USER_ANALYST}', '{USER_ADMIN}', 'PLAT-7'), "
        # Mobile App v2 tasks (7)
        f"('{TASKS[7]}', 'Design system setup', 'Create Figma design tokens and component library', 'done', 'high', NOW() - INTERVAL '10 days', '{PROJ_MOBILE}', '{USER_REGULAR}', '{USER_MANAGER}', 'MOB-1'), "
        f"('{TASKS[8]}', 'Offline data sync engine', 'Build SQLite sync engine for offline-first architecture', 'in_progress', 'critical', NOW() + INTERVAL '2 days', '{PROJ_MOBILE}', '{USER_ANALYST}', '{USER_MANAGER}', 'MOB-2'), "
        f"('{TASKS[9]}', 'Push notification service', 'Integrate Firebase Cloud Messaging', 'in_progress', 'high', NOW() + INTERVAL '5 days', '{PROJ_MOBILE}', '{USER_REGULAR}', '{USER_MANAGER}', 'MOB-3'), "
        f"('{TASKS[10]}', 'Biometric authentication', 'Add Face ID and fingerprint login support', 'todo', 'medium', NOW() + INTERVAL '10 days', '{PROJ_MOBILE}', '{USER_ANALYST}', '{USER_MANAGER}', NULL), "
        f"('{TASKS[11]}', 'App store submission prep', 'Prepare screenshots, descriptions, and metadata', 'todo', 'low', NOW() + INTERVAL '30 days', '{PROJ_MOBILE}', '{USER_REGULAR}', '{USER_MANAGER}', NULL), "
        f"('{TASKS[12]}', 'Performance profiling', 'Profile app startup time and optimize cold start', 'blocked', 'high', NOW() - INTERVAL '2 days', '{PROJ_MOBILE}', '{USER_ANALYST}', '{USER_MANAGER}', 'MOB-6'), "
        f"('{TASKS[13]}', 'E2E test suite', 'Write Detox end-to-end tests for critical flows', 'in_review', 'medium', NOW() + INTERVAL '3 days', '{PROJ_MOBILE}', '{USER_REGULAR}', '{USER_MANAGER}', 'MOB-7'), "
        # Data Pipeline tasks (6)
        f"('{TASKS[14]}', 'Kafka cluster setup', 'Deploy Kafka cluster on Azure Event Hubs', 'done', 'critical', NOW() - INTERVAL '15 days', '{PROJ_DATA}', '{USER_ADMIN}', '{USER_ANALYST}', 'DATA-1'), "
        f"('{TASKS[15]}', 'Schema registry', 'Set up Confluent Schema Registry for Avro schemas', 'done', 'high', NOW() - INTERVAL '8 days', '{PROJ_DATA}', '{USER_ANALYST}', '{USER_ANALYST}', 'DATA-2'), "
        f"('{TASKS[16]}', 'Stream processing jobs', 'Build Flink jobs for real-time aggregation', 'in_progress', 'critical', NOW() + INTERVAL '1 day', '{PROJ_DATA}', '{USER_ANALYST}', '{USER_ANALYST}', 'DATA-3'), "
        f"('{TASKS[17]}', 'Data quality checks', 'Implement Great Expectations validation suite', 'todo', 'high', NOW() + INTERVAL '5 days', '{PROJ_DATA}', '{USER_REGULAR}', '{USER_ANALYST}', NULL), "
        f"('{TASKS[18]}', 'Dashboard integration', 'Connect pipeline output to Grafana dashboards', 'todo', 'medium', NOW() + INTERVAL '12 days', '{PROJ_DATA}', '{USER_ADMIN}', '{USER_ANALYST}', NULL), "
        f"('{TASKS[19]}', 'Alerting rules', 'Configure PagerDuty alerts for pipeline failures', 'todo', 'low', NOW() + INTERVAL '20 days', '{PROJ_DATA}', '{USER_MANAGER}', '{USER_ANALYST}', NULL) "
        "ON CONFLICT (id) DO NOTHING"
    )
    op.execute(sa.text(tasks_sql))

    # --- Checklist Items ---
    # Task 1 (done): 3 items, all completed
    checklist_sql_parts = []

    # Task 0 (Set up K8s - done): 4 items all completed
    for i, title in enumerate([
        "Provision EKS cluster",
        "Configure VPC and subnets",
        "Set up kubectl access",
        "Install cert-manager",
    ], 1):
        checklist_sql_parts.append(
            f"('{cl_id(1, i)}', '{TASKS[0]}', '{title}', true, '{USER_ADMIN}', NOW() - INTERVAL '6 days', {i})"
        )

    # Task 2 (Migrate user database - in_progress): 4 items, 2 completed
    for i, (title, done) in enumerate([
        ("Export user data from old DB", True),
        ("Create new schema in target DB", True),
        ("Run data migration script", False),
        ("Verify data integrity", False),
    ], 1):
        if done:
            checklist_sql_parts.append(
                f"('{cl_id(3, i)}', '{TASKS[2]}', '{title}', true, '{USER_ADMIN}', NOW() - INTERVAL '2 days', {i})"
            )
        else:
            checklist_sql_parts.append(
                f"('{cl_id(3, i)}', '{TASKS[2]}', '{title}', false, NULL, NULL, {i})"
            )

    # Task 3 (CI/CD pipelines - in_review): 5 items, 4 completed
    for i, (title, done) in enumerate([
        ("Set up GitHub Actions workflows", True),
        ("Configure Docker build step", True),
        ("Add integration test stage", True),
        ("Set up deployment to staging", True),
        ("Add production deployment approval gate", False),
    ], 1):
        if done:
            checklist_sql_parts.append(
                f"('{cl_id(4, i)}', '{TASKS[3]}', '{title}', true, '{USER_ANALYST}', NOW() - INTERVAL '1 day', {i})"
            )
        else:
            checklist_sql_parts.append(
                f"('{cl_id(4, i)}', '{TASKS[3]}', '{title}', false, NULL, NULL, {i})"
            )

    # Task 6 (Security audit - blocked): 3 items, none completed
    for i, title in enumerate([
        "Run OWASP ZAP scan",
        "Review IAM policies",
        "Penetration test report",
    ], 1):
        checklist_sql_parts.append(
            f"('{cl_id(7, i)}', '{TASKS[6]}', '{title}', false, NULL, NULL, {i})"
        )

    # Task 7 (Design system - done): 3 items all completed
    for i, title in enumerate([
        "Define color palette and typography",
        "Create button and input components",
        "Document usage guidelines",
    ], 1):
        checklist_sql_parts.append(
            f"('{cl_id(8, i)}', '{TASKS[7]}', '{title}', true, '{USER_REGULAR}', NOW() - INTERVAL '11 days', {i})"
        )

    # Task 8 (Offline sync - in_progress): 4 items, 1 completed
    for i, (title, done) in enumerate([
        ("Design sync conflict resolution strategy", True),
        ("Implement SQLite local storage", False),
        ("Build sync queue manager", False),
        ("Add retry logic with exponential backoff", False),
    ], 1):
        if done:
            checklist_sql_parts.append(
                f"('{cl_id(9, i)}', '{TASKS[8]}', '{title}', true, '{USER_ANALYST}', NOW() - INTERVAL '1 day', {i})"
            )
        else:
            checklist_sql_parts.append(
                f"('{cl_id(9, i)}', '{TASKS[8]}', '{title}', false, NULL, NULL, {i})"
            )

    # Task 12 (Performance profiling - blocked): 3 items, none
    for i, title in enumerate([
        "Set up profiling environment",
        "Capture startup trace",
        "Identify and fix bottlenecks",
    ], 1):
        checklist_sql_parts.append(
            f"('{cl_id(13, i)}', '{TASKS[12]}', '{title}', false, NULL, NULL, {i})"
        )

    # Task 13 (E2E tests - in_review): 4 items, 3 completed
    for i, (title, done) in enumerate([
        ("Set up Detox test framework", True),
        ("Write login flow tests", True),
        ("Write data sync flow tests", True),
        ("Write push notification tests", False),
    ], 1):
        if done:
            checklist_sql_parts.append(
                f"('{cl_id(14, i)}', '{TASKS[13]}', '{title}', true, '{USER_REGULAR}', NOW() - INTERVAL '1 day', {i})"
            )
        else:
            checklist_sql_parts.append(
                f"('{cl_id(14, i)}', '{TASKS[13]}', '{title}', false, NULL, NULL, {i})"
            )

    # Task 14 (Kafka - done): 3 items all completed
    for i, title in enumerate([
        "Provision Event Hubs namespace",
        "Configure topics and partitions",
        "Test producer and consumer",
    ], 1):
        checklist_sql_parts.append(
            f"('{cl_id(15, i)}', '{TASKS[14]}', '{title}', true, '{USER_ADMIN}', NOW() - INTERVAL '16 days', {i})"
        )

    # Task 16 (Stream processing - in_progress): 4 items, 2 completed
    for i, (title, done) in enumerate([
        ("Set up Flink cluster", True),
        ("Build aggregation job", True),
        ("Add windowing logic", False),
        ("Deploy to staging", False),
    ], 1):
        if done:
            checklist_sql_parts.append(
                f"('{cl_id(17, i)}', '{TASKS[16]}', '{title}', true, '{USER_ANALYST}', NOW() - INTERVAL '2 days', {i})"
            )
        else:
            checklist_sql_parts.append(
                f"('{cl_id(17, i)}', '{TASKS[16]}', '{title}', false, NULL, NULL, {i})"
            )

    checklist_values = ", ".join(checklist_sql_parts)
    op.execute(
        sa.text(
            "INSERT INTO checklist_items (id, task_id, title, is_completed, completed_by_id, completed_at, sort_order) VALUES "
            f"{checklist_values} "
            "ON CONFLICT (id) DO NOTHING"
        )
    )


def downgrade() -> None:
    # Delete in reverse order of foreign key dependencies
    op.execute(sa.text("DELETE FROM checklist_items WHERE id LIKE '60000000-%'"))
    op.execute(sa.text("DELETE FROM jira_sync_status WHERE task_id LIKE '50000000-%'"))
    op.execute(sa.text("DELETE FROM tasks WHERE id LIKE '50000000-%'"))
    op.execute(sa.text("DELETE FROM projects WHERE id LIKE '40000000-%'"))
    op.execute(sa.text("DELETE FROM users WHERE id LIKE '30000000-%'"))
