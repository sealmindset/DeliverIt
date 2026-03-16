from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.project import Project
from app.models.task import Task
from app.schemas.auth import UserInfo
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    user: UserInfo = require_permission("projects", "view"),
    db: AsyncSession = Depends(get_db),
):
    # Get projects with task counts
    result = await db.execute(
        select(Project, func.count(Task.id).label("task_count"))
        .outerjoin(Task, Task.project_id == Project.id)
        .group_by(Project.id)
        .order_by(Project.created_at.desc())
    )
    rows = result.all()
    return [ProjectOut.from_model(project, task_count) for project, task_count in rows]


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: UUID,
    user: UserInfo = require_permission("projects", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Project, func.count(Task.id).label("task_count"))
        .outerjoin(Task, Task.project_id == Project.id)
        .where(Project.id == project_id)
        .group_by(Project.id)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    project, task_count = row
    return ProjectOut.from_model(project, task_count)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    user: UserInfo = require_permission("projects", "create"),
    db: AsyncSession = Depends(get_db),
):
    # Look up the user's DB id from their oidc_subject
    from app.models.user import User

    user_result = await db.execute(
        select(User).where(User.oidc_subject == user.sub)
    )
    db_user = user_result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found in database")

    new_project = Project(
        name=data.name,
        description=data.description,
        status=data.status,
        jira_project_key=data.jira_project_key,
        created_by_id=db_user.id,
    )
    db.add(new_project)
    await db.flush()
    await db.refresh(new_project)
    return ProjectOut.from_model(new_project, 0)


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    user: UserInfo = require_permission("projects", "edit"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status is not None:
        project.status = data.status
    if data.jira_project_key is not None:
        project.jira_project_key = data.jira_project_key

    await db.flush()
    await db.refresh(project)

    # Get updated task count
    count_result = await db.execute(
        select(func.count(Task.id)).where(Task.project_id == project_id)
    )
    task_count = count_result.scalar() or 0
    return ProjectOut.from_model(project, task_count)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    user: UserInfo = require_permission("projects", "delete"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
