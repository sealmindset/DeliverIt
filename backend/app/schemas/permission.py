from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PermissionOut(BaseModel):
    id: UUID
    resource: str
    action: str
    description: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
