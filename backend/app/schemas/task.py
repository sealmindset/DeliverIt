from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.task import TaskPriority, TaskStatus
from app.schemas.checklist import ChecklistItemOut


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    deadline: datetime | None = None
    project_id: UUID
    assignee_id: UUID | None = None
    jira_key: str | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    deadline: datetime | None = None
    assignee_id: UUID | None = None
    jira_key: str | None = None


class TaskOut(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    status: TaskStatus
    priority: TaskPriority
    deadline: datetime | None = None
    project_id: UUID
    project_name: str | None = None
    assignee_id: UUID | None = None
    assignee_name: str | None = None
    created_by_id: UUID
    jira_key: str | None = None
    jira_sync_status: str | None = None
    checklist_items: list[ChecklistItemOut] = []
    checklist_complete: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_model(cls, task) -> "TaskOut":
        checklist_items = [
            ChecklistItemOut.from_model(item) for item in (task.checklist_items or [])
        ]
        all_complete = (
            len(checklist_items) > 0
            and all(item.is_completed for item in checklist_items)
        )
        return cls(
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            deadline=task.deadline,
            project_id=task.project_id,
            project_name=task.project.name if task.project else None,
            assignee_id=task.assignee_id,
            assignee_name=task.assignee.display_name if task.assignee else None,
            created_by_id=task.created_by_id,
            jira_key=task.jira_key,
            jira_sync_status=task.jira_sync_status,
            checklist_items=checklist_items,
            checklist_complete=all_complete,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
