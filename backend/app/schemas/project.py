from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.project import ProjectStatus


class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    status: ProjectStatus = ProjectStatus.active
    jira_project_key: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    jira_project_key: str | None = None


class ProjectOut(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    status: ProjectStatus
    jira_project_key: str | None = None
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime
    task_count: int = 0

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_model(cls, project, task_count: int = 0) -> "ProjectOut":
        return cls(
            id=project.id,
            name=project.name,
            description=project.description,
            status=project.status,
            jira_project_key=project.jira_project_key,
            created_by_id=project.created_by_id,
            created_at=project.created_at,
            updated_at=project.updated_at,
            task_count=task_count,
        )
