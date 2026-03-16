"""Seed 4 system roles + page-level CRUD permissions + role-permission mappings

Revision ID: 002
Revises: 001
Create Date: 2026-03-13
"""

from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None

# Deterministic UUIDs for roles
ROLE_SUPER_ADMIN = "10000000-0000-0000-0000-000000000001"
ROLE_ADMIN = "10000000-0000-0000-0000-000000000002"
ROLE_MANAGER = "10000000-0000-0000-0000-000000000003"
ROLE_USER = "10000000-0000-0000-0000-000000000004"

# Permission definitions: (resource, action, description, uuid)
PERMISSIONS = [
    ("dashboard", "view", "View dashboard", "20000000-0000-0000-0000-000000000001"),
    ("projects", "view", "View projects", "20000000-0000-0000-0000-000000000002"),
    ("projects", "create", "Create projects", "20000000-0000-0000-0000-000000000003"),
    ("projects", "edit", "Edit projects", "20000000-0000-0000-0000-000000000004"),
    ("projects", "delete", "Delete projects", "20000000-0000-0000-0000-000000000005"),
    ("tasks", "view", "View tasks", "20000000-0000-0000-0000-000000000006"),
    ("tasks", "create", "Create tasks", "20000000-0000-0000-0000-000000000007"),
    ("tasks", "edit", "Edit tasks", "20000000-0000-0000-0000-000000000008"),
    ("tasks", "delete", "Delete tasks", "20000000-0000-0000-0000-000000000009"),
    ("checklists", "view", "View checklists", "20000000-0000-0000-0000-000000000010"),
    ("checklists", "create", "Create checklists", "20000000-0000-0000-0000-000000000011"),
    ("checklists", "edit", "Edit checklists", "20000000-0000-0000-0000-000000000012"),
    ("checklists", "delete", "Delete checklists", "20000000-0000-0000-0000-000000000013"),
    ("users", "view", "View users", "20000000-0000-0000-0000-000000000014"),
    ("users", "create", "Create users", "20000000-0000-0000-0000-000000000015"),
    ("users", "edit", "Edit users", "20000000-0000-0000-0000-000000000016"),
    ("users", "delete", "Delete users", "20000000-0000-0000-0000-000000000017"),
    ("roles", "view", "View roles", "20000000-0000-0000-0000-000000000018"),
    ("roles", "create", "Create roles", "20000000-0000-0000-0000-000000000019"),
    ("roles", "edit", "Edit roles", "20000000-0000-0000-0000-000000000020"),
    ("roles", "delete", "Delete roles", "20000000-0000-0000-0000-000000000021"),
]

# All permission UUIDs
ALL_PERM_IDS = [p[3] for p in PERMISSIONS]

# Admin: all except roles.create/edit/delete
ADMIN_EXCLUDED = {"20000000-0000-0000-0000-000000000019", "20000000-0000-0000-0000-000000000020", "20000000-0000-0000-0000-000000000021"}
ADMIN_PERM_IDS = [pid for pid in ALL_PERM_IDS if pid not in ADMIN_EXCLUDED]

# Manager: dashboard.view, projects.view/create/edit, tasks.view/create/edit/delete, checklists.view/create/edit/delete
MANAGER_PERM_IDS = [
    "20000000-0000-0000-0000-000000000001",  # dashboard.view
    "20000000-0000-0000-0000-000000000002",  # projects.view
    "20000000-0000-0000-0000-000000000003",  # projects.create
    "20000000-0000-0000-0000-000000000004",  # projects.edit
    "20000000-0000-0000-0000-000000000006",  # tasks.view
    "20000000-0000-0000-0000-000000000007",  # tasks.create
    "20000000-0000-0000-0000-000000000008",  # tasks.edit
    "20000000-0000-0000-0000-000000000009",  # tasks.delete
    "20000000-0000-0000-0000-000000000010",  # checklists.view
    "20000000-0000-0000-0000-000000000011",  # checklists.create
    "20000000-0000-0000-0000-000000000012",  # checklists.edit
    "20000000-0000-0000-0000-000000000013",  # checklists.delete
]

# User: dashboard.view, projects.view, tasks.view/edit, checklists.view/edit
USER_PERM_IDS = [
    "20000000-0000-0000-0000-000000000001",  # dashboard.view
    "20000000-0000-0000-0000-000000000002",  # projects.view
    "20000000-0000-0000-0000-000000000006",  # tasks.view
    "20000000-0000-0000-0000-000000000008",  # tasks.edit
    "20000000-0000-0000-0000-000000000010",  # checklists.view
    "20000000-0000-0000-0000-000000000012",  # checklists.edit
]


def upgrade() -> None:
    # Insert roles
    op.execute(
        sa.text(
            "INSERT INTO roles (id, name, description, is_system) VALUES "
            f"('{ROLE_SUPER_ADMIN}', 'Super Admin', 'Full system access, manages users and roles', true), "
            f"('{ROLE_ADMIN}', 'Admin', 'App administration, user management', true), "
            f"('{ROLE_MANAGER}', 'Manager', 'Assign tasks, set deadlines, view dashboards, manage projects', true), "
            f"('{ROLE_USER}', 'User', 'View assigned tasks, update status, complete readiness checklists', true) "
            "ON CONFLICT (id) DO NOTHING"
        )
    )

    # Insert permissions
    values_parts = []
    for resource, action, description, pid in PERMISSIONS:
        values_parts.append(f"('{pid}', '{resource}', '{action}', '{description}')")
    values_sql = ", ".join(values_parts)
    op.execute(
        sa.text(
            f"INSERT INTO permissions (id, resource, action, description) VALUES {values_sql} "
            "ON CONFLICT (id) DO NOTHING"
        )
    )

    # Super Admin: ALL permissions
    rp_values = []
    for pid in ALL_PERM_IDS:
        rp_values.append(f"('{ROLE_SUPER_ADMIN}', '{pid}')")

    # Admin permissions
    for pid in ADMIN_PERM_IDS:
        rp_values.append(f"('{ROLE_ADMIN}', '{pid}')")

    # Manager permissions
    for pid in MANAGER_PERM_IDS:
        rp_values.append(f"('{ROLE_MANAGER}', '{pid}')")

    # User permissions
    for pid in USER_PERM_IDS:
        rp_values.append(f"('{ROLE_USER}', '{pid}')")

    rp_sql = ", ".join(rp_values)
    op.execute(
        sa.text(
            f"INSERT INTO role_permissions (role_id, permission_id) VALUES {rp_sql} "
            "ON CONFLICT (role_id, permission_id) DO NOTHING"
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM role_permissions"))
    op.execute(sa.text("DELETE FROM permissions"))
    op.execute(sa.text("DELETE FROM roles WHERE is_system = true"))
