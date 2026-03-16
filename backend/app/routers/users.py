from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.user import User
from app.models.role import Role
from app.schemas.auth import UserInfo
from app.schemas.user import UserCreate, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def list_users(
    user: UserInfo = require_permission("users", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.display_name))
    users = result.scalars().all()
    return [UserOut.from_model(u) for u in users]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    user: UserInfo = require_permission("users", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.from_model(db_user)


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    user: UserInfo = require_permission("users", "create"),
    db: AsyncSession = Depends(get_db),
):
    # Check role exists
    role_result = await db.execute(select(Role).where(Role.id == data.role_id))
    if not role_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Role not found")

    # Check for duplicate oidc_subject or email
    existing = await db.execute(
        select(User).where(
            (User.oidc_subject == data.oidc_subject) | (User.email == data.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already exists")

    new_user = User(
        oidc_subject=data.oidc_subject,
        email=data.email,
        display_name=data.display_name,
        role_id=data.role_id,
    )
    db.add(new_user)
    await db.flush()
    await db.refresh(new_user)
    return UserOut.from_model(new_user)


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    user: UserInfo = require_permission("users", "edit"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.email is not None:
        db_user.email = data.email
    if data.display_name is not None:
        db_user.display_name = data.display_name
    if data.role_id is not None:
        role_result = await db.execute(select(Role).where(Role.id == data.role_id))
        if not role_result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Role not found")
        db_user.role_id = data.role_id
    if data.is_active is not None:
        db_user.is_active = data.is_active

    await db.flush()
    await db.refresh(db_user)
    return UserOut.from_model(db_user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    user: UserInfo = require_permission("users", "delete"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(db_user)
