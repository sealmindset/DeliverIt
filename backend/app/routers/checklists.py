from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.checklist import ChecklistItem
from app.models.task import Task
from app.models.user import User
from app.schemas.auth import UserInfo
from app.schemas.checklist import ChecklistItemCreate, ChecklistItemOut, ChecklistItemUpdate

router = APIRouter(prefix="/checklists", tags=["checklists"])


@router.get("", response_model=list[ChecklistItemOut])
async def list_checklist_items(
    task_id: UUID = Query(...),
    user: UserInfo = require_permission("checklists", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChecklistItem)
        .where(ChecklistItem.task_id == task_id)
        .order_by(ChecklistItem.sort_order, ChecklistItem.created_at)
    )
    items = result.scalars().all()
    return [ChecklistItemOut.from_model(item) for item in items]


@router.get("/{item_id}", response_model=ChecklistItemOut)
async def get_checklist_item(
    item_id: UUID,
    user: UserInfo = require_permission("checklists", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    return ChecklistItemOut.from_model(item)


@router.post("", response_model=ChecklistItemOut, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    data: ChecklistItemCreate,
    user: UserInfo = require_permission("checklists", "create"),
    db: AsyncSession = Depends(get_db),
):
    # Verify task exists
    task_result = await db.execute(select(Task).where(Task.id == data.task_id))
    if not task_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Task not found")

    new_item = ChecklistItem(
        task_id=data.task_id,
        title=data.title,
        sort_order=data.sort_order,
    )
    db.add(new_item)
    await db.flush()
    await db.refresh(new_item)
    return ChecklistItemOut.from_model(new_item)


@router.put("/{item_id}", response_model=ChecklistItemOut)
async def update_checklist_item(
    item_id: UUID,
    data: ChecklistItemUpdate,
    user: UserInfo = require_permission("checklists", "edit"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    if data.title is not None:
        item.title = data.title
    if data.sort_order is not None:
        item.sort_order = data.sort_order
    if data.is_completed is not None:
        if data.is_completed and not item.is_completed:
            # Marking as completed -- record who and when
            db_user_result = await db.execute(
                select(User).where(User.oidc_subject == user.sub)
            )
            db_user = db_user_result.scalar_one_or_none()
            item.is_completed = True
            item.completed_by_id = db_user.id if db_user else None
            item.completed_at = datetime.now(timezone.utc)
        elif not data.is_completed and item.is_completed:
            # Unchecking
            item.is_completed = False
            item.completed_by_id = None
            item.completed_at = None

    await db.flush()
    await db.refresh(item)
    return ChecklistItemOut.from_model(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist_item(
    item_id: UUID,
    user: UserInfo = require_permission("checklists", "delete"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChecklistItem).where(ChecklistItem.id == item_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    await db.delete(item)
