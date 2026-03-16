import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Role

# In-memory permission cache: role_id -> set of "resource.action" strings
_permission_cache: dict[uuid.UUID, set[str]] = {}


def invalidate_cache(role_id: Optional[uuid.UUID] = None) -> None:
    """Invalidate permission cache for a specific role or all roles."""
    if role_id:
        _permission_cache.pop(role_id, None)
    else:
        _permission_cache.clear()


async def load_permissions_for_role(
    db: AsyncSession, role_id: uuid.UUID
) -> set[str]:
    """Load permissions for a role from the database and cache them."""
    if role_id in _permission_cache:
        return _permission_cache[role_id]

    result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()
    if not role:
        return set()

    perms = {f"{p.resource}.{p.action}" for p in role.permissions}
    _permission_cache[role_id] = perms
    return perms


async def has_permission(
    db: AsyncSession, role_id: uuid.UUID, resource: str, action: str
) -> bool:
    """Check if a role has a specific permission."""
    perms = await load_permissions_for_role(db, role_id)
    return f"{resource}.{action}" in perms
