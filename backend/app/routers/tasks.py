from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.task import Task, TaskStatus
from app.models.checklist import ChecklistItem
from app.models.project import Project
from app.schemas.auth import UserInfo
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

# Valid status transitions
VALID_TRANSITIONS: dict[TaskStatus, set[TaskStatus]] = {
    TaskStatus.todo: {TaskStatus.in_progress, TaskStatus.blocked},
    TaskStatus.in_progress: {
        TaskStatus.in_review,
        TaskStatus.blocked,
        TaskStatus.todo,
    },
    TaskStatus.in_review: {
        TaskStatus.done,
        TaskStatus.in_progress,
        TaskStatus.blocked,
    },
    TaskStatus.blocked: {TaskStatus.todo, TaskStatus.in_progress},
    TaskStatus.done: {TaskStatus.in_progress},  # reopen
}


@router.get("", response_model=list[TaskOut])
async def list_tasks(
    project_id: UUID | None = Query(None),
    assignee_id: UUID | None = Query(None),
    task_status: TaskStatus | None = Query(None, alias="status"),
    user: UserInfo = require_permission("tasks", "view"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Task)
    if project_id:
        query = query.where(Task.project_id == project_id)
    if assignee_id:
        query = query.where(Task.assignee_id == assignee_id)
    if task_status:
        query = query.where(Task.status == task_status)
    query = query.order_by(Task.created_at.desc())

    result = await db.execute(query)
    tasks = result.scalars().all()
    return [TaskOut.from_model(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: UUID,
    user: UserInfo = require_permission("tasks", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskOut.from_model(task)


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    user: UserInfo = require_permission("tasks", "create"),
    db: AsyncSession = Depends(get_db),
):
    # Verify project exists
    proj_result = await db.execute(
        select(Project).where(Project.id == data.project_id)
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Project not found")

    # Look up creator's DB id
    from app.models.user import User

    user_result = await db.execute(
        select(User).where(User.oidc_subject == user.sub)
    )
    db_user = user_result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found in database")

    new_task = Task(
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        deadline=data.deadline,
        project_id=data.project_id,
        assignee_id=data.assignee_id,
        created_by_id=db_user.id,
        jira_key=data.jira_key,
    )
    db.add(new_task)
    await db.flush()
    await db.refresh(new_task)
    return TaskOut.from_model(new_task)


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    user: UserInfo = require_permission("tasks", "edit"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate status transition
    if data.status is not None and data.status != task.status:
        allowed = VALID_TRANSITIONS.get(task.status, set())
        if data.status not in allowed:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status transition from {task.status.value} to {data.status.value}",
            )

        # Enforce checklist completion before marking done
        if data.status == TaskStatus.done:
            checklist_result = await db.execute(
                select(ChecklistItem).where(ChecklistItem.task_id == task_id)
            )
            items = checklist_result.scalars().all()
            if items and not all(item.is_completed for item in items):
                raise HTTPException(
                    status_code=400,
                    detail="Cannot mark task as done: not all checklist items are completed",
                )

    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.status is not None:
        task.status = data.status
    if data.priority is not None:
        task.priority = data.priority
    if data.deadline is not None:
        task.deadline = data.deadline
    if data.assignee_id is not None:
        task.assignee_id = data.assignee_id
    if data.jira_key is not None:
        task.jira_key = data.jira_key

    await db.flush()
    await db.refresh(task)
    return TaskOut.from_model(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    user: UserInfo = require_permission("tasks", "delete"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
