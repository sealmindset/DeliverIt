from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.schemas.auth import UserInfo

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(
    user: UserInfo = require_permission("dashboard", "view"),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    three_days_from_now = now + timedelta(days=3)

    # Project count
    project_count_result = await db.execute(select(func.count(Project.id)))
    project_count = project_count_result.scalar() or 0

    # Task counts by status
    status_result = await db.execute(
        select(Task.status, func.count(Task.id)).group_by(Task.status)
    )
    status_counts = {row[0].value: row[1] for row in status_result.all()}

    total_tasks = sum(status_counts.values())

    # Overdue tasks (deadline < now and not done)
    overdue_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.deadline < now,
            Task.status != TaskStatus.done,
            Task.deadline.isnot(None),
        )
    )
    overdue_count = overdue_result.scalar() or 0

    # At risk tasks (deadline within 3 days and not done)
    at_risk_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.deadline >= now,
            Task.deadline <= three_days_from_now,
            Task.status != TaskStatus.done,
            Task.deadline.isnot(None),
        )
    )
    at_risk_count = at_risk_result.scalar() or 0

    # Completion rate
    done_count = status_counts.get("done", 0)
    completion_rate = (
        round((done_count / total_tasks) * 100, 1) if total_tasks > 0 else 0.0
    )

    # Recent activity -- 10 most recently updated tasks
    recent_result = await db.execute(
        select(Task).order_by(Task.updated_at.desc()).limit(10)
    )
    recent_tasks = recent_result.scalars().all()
    recent_activity = [
        {
            "id": str(t.id),
            "title": t.title,
            "status": t.status.value,
            "priority": t.priority.value,
            "project_id": str(t.project_id),
            "project_name": t.project.name if t.project else None,
            "assignee_name": t.assignee.display_name if t.assignee else None,
            "updated_at": t.updated_at.isoformat(),
        }
        for t in recent_tasks
    ]

    # Active tasks = total - done
    active_tasks = total_tasks - done_count

    # At-risk tasks list (due within 3 days or overdue, not done)
    at_risk_tasks_result = await db.execute(
        select(Task)
        .where(
            Task.deadline <= three_days_from_now,
            Task.status != TaskStatus.done,
            Task.deadline.isnot(None),
        )
        .order_by(Task.deadline.asc())
        .limit(10)
    )
    at_risk_tasks_list = [
        {
            "id": str(t.id),
            "title": t.title,
            "project_name": t.project.name if t.project else "",
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "assignee_name": t.assignee.display_name if t.assignee else None,
            "priority": t.priority.value,
        }
        for t in at_risk_tasks_result.scalars().all()
    ]

    # Tasks by status as array
    all_statuses = ["todo", "in_progress", "in_review", "blocked", "done"]
    tasks_by_status = [
        {"status": s, "count": status_counts.get(s, 0)} for s in all_statuses
    ]

    # Recent activity as descriptive entries
    activity = [
        {
            "id": str(t.id),
            "description": f"{t.title} ({t.status.value.replace('_', ' ')})",
            "timestamp": t.updated_at.isoformat(),
            "user_name": t.assignee.display_name if t.assignee else "Unassigned",
        }
        for t in recent_tasks
    ]

    return {
        "stats": {
            "total_projects": project_count,
            "active_tasks": active_tasks,
            "overdue_tasks": overdue_count,
            "completion_rate": completion_rate,
        },
        "tasks_by_status": tasks_by_status,
        "at_risk_tasks": at_risk_tasks_list,
        "recent_activity": activity,
    }
