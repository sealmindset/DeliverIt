from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.permission import Permission
from app.models.role import Role
from app.schemas.auth import UserInfo
from app.schemas.role import RoleCreate, RoleOut, RoleUpdate
from app.services.permission_service import invalidate_cache

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleOut])
async def list_roles(
    user: UserInfo = require_permission("roles", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).order_by(Role.name))
    roles = result.scalars().all()
    return [RoleOut.model_validate(r) for r in roles]


@router.get("/{role_id}", response_model=RoleOut)
async def get_role(
    role_id: UUID,
    user: UserInfo = require_permission("roles", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return RoleOut.model_validate(role)


@router.post("", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
async def create_role(
    data: RoleCreate,
    user: UserInfo = require_permission("roles", "create"),
    db: AsyncSession = Depends(get_db),
):
    # Check for duplicate name
    existing = await db.execute(select(Role).where(Role.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Role name already exists")

    new_role = Role(name=data.name, description=data.description, is_system=False)

    # Assign permissions
    if data.permission_ids:
        perm_result = await db.execute(
            select(Permission).where(Permission.id.in_(data.permission_ids))
        )
        perms = perm_result.scalars().all()
        new_role.permissions = list(perms)

    db.add(new_role)
    await db.flush()
    await db.refresh(new_role)
    invalidate_cache(new_role.id)
    return RoleOut.model_validate(new_role)


@router.put("/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: UUID,
    data: RoleUpdate,
    user: UserInfo = require_permission("roles", "edit"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_system:
        raise HTTPException(
            status_code=400, detail="System roles cannot be modified"
        )

    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.permission_ids is not None:
        perm_result = await db.execute(
            select(Permission).where(Permission.id.in_(data.permission_ids))
        )
        perms = perm_result.scalars().all()
        role.permissions = list(perms)

    await db.flush()
    await db.refresh(role)
    invalidate_cache(role_id)
    return RoleOut.model_validate(role)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: UUID,
    user: UserInfo = require_permission("roles", "delete"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    if role.is_system:
        raise HTTPException(
            status_code=400, detail="System roles cannot be deleted"
        )

    await db.delete(role)
    invalidate_cache(role_id)
