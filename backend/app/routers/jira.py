from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.models.task import Task
from app.models.jira_sync import JiraSyncStatus
from app.schemas.auth import UserInfo
from app.services.jira_client import jira_client

router = APIRouter(prefix="/jira", tags=["jira"])


@router.get("/projects")
async def list_jira_projects(
    user: UserInfo = require_permission("projects", "view"),
):
    """List projects from Jira."""
    try:
        data = await jira_client.list_projects()
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Jira API error: {str(e)}")


@router.get("/issues")
async def search_jira_issues(
    jql: str = Query(...),
    user: UserInfo = require_permission("tasks", "view"),
):
    """Search Jira issues with JQL."""
    try:
        data = await jira_client.search_issues(jql)
        return data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Jira API error: {str(e)}")


@router.post("/sync/{task_id}")
async def sync_task_to_jira(
    task_id: UUID,
    user: UserInfo = require_permission("tasks", "edit"),
    db: AsyncSession = Depends(get_db),
):
    """Create or update a Jira issue for a task."""
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not task.project or not task.project.jira_project_key:
        raise HTTPException(
            status_code=400,
            detail="Project does not have a Jira project key configured",
        )

    try:
        if task.jira_key:
            # Update existing issue status
            # Map task status to Jira transition
            status_map = {
                "todo": "11",        # To Do
                "in_progress": "21", # In Progress
                "in_review": "31",   # In Review
                "done": "41",        # Done
                "blocked": "51",     # Blocked
            }
            transition_id = status_map.get(task.status.value, "11")
            await jira_client.update_issue_status(task.jira_key, transition_id)
            sync_status = "synced"
        else:
            # Create new issue
            payload = {
                "fields": {
                    "project": {"key": task.project.jira_project_key},
                    "summary": task.title,
                    "description": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": task.description or "",
                                    }
                                ],
                            }
                        ],
                    },
                    "issuetype": {"name": "Task"},
                    "priority": {
                        "name": task.priority.value.capitalize()
                    },
                }
            }
            jira_response = await jira_client.create_issue(payload)
            task.jira_key = jira_response.get("key")
            sync_status = "synced"

        # Update or create sync status record
        sync_result = await db.execute(
            select(JiraSyncStatus).where(JiraSyncStatus.task_id == task_id)
        )
        sync_record = sync_result.scalar_one_or_none()

        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        if sync_record:
            sync_record.jira_key = task.jira_key or ""
            sync_record.last_synced_at = now
            sync_record.sync_status = sync_status
            sync_record.error_message = None
        else:
            sync_record = JiraSyncStatus(
                task_id=task_id,
                jira_key=task.jira_key or "",
                last_synced_at=now,
                sync_direction="outbound",
                sync_status=sync_status,
            )
            db.add(sync_record)

        task.jira_sync_status = sync_status
        await db.flush()

        return {
            "status": "success",
            "jira_key": task.jira_key,
            "sync_status": sync_status,
        }

    except Exception as e:
        # Record failure
        task.jira_sync_status = "error"

        sync_result = await db.execute(
            select(JiraSyncStatus).where(JiraSyncStatus.task_id == task_id)
        )
        sync_record = sync_result.scalar_one_or_none()

        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        if sync_record:
            sync_record.sync_status = "error"
            sync_record.error_message = str(e)
        else:
            sync_record = JiraSyncStatus(
                task_id=task_id,
                jira_key=task.jira_key or "",
                last_synced_at=now,
                sync_direction="outbound",
                sync_status="error",
                error_message=str(e),
            )
            db.add(sync_record)

        await db.flush()
        raise HTTPException(
            status_code=502, detail=f"Jira sync failed: {str(e)}"
        )
