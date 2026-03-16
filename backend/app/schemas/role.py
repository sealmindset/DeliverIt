from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RoleBase(BaseModel):
    name: str
    description: str | None = None


class RoleCreate(RoleBase):
    permission_ids: list[UUID] = []


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_ids: list[UUID] | None = None


class PermissionOut(BaseModel):
    id: UUID
    resource: str
    action: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RoleOut(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    is_system: bool
    permissions: list[PermissionOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
