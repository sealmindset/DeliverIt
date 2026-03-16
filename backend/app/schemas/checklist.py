from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChecklistItemBase(BaseModel):
    title: str
    sort_order: int = 0


class ChecklistItemCreate(ChecklistItemBase):
    task_id: UUID


class ChecklistItemUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None
    sort_order: int | None = None


class ChecklistItemOut(BaseModel):
    id: UUID
    task_id: UUID
    title: str
    is_completed: bool
    completed_by_id: UUID | None = None
    completed_by_name: str | None = None
    completed_at: datetime | None = None
    sort_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_model(cls, item) -> "ChecklistItemOut":
        return cls(
            id=item.id,
            task_id=item.task_id,
            title=item.title,
            is_completed=item.is_completed,
            completed_by_id=item.completed_by_id,
            completed_by_name=(
                item.completed_by.display_name if item.completed_by else None
            ),
            completed_at=item.completed_at,
            sort_order=item.sort_order,
            created_at=item.created_at,
        )
