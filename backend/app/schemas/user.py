from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    display_name: str


class UserCreate(UserBase):
    oidc_subject: str
    role_id: UUID


class UserUpdate(BaseModel):
    email: str | None = None
    display_name: str | None = None
    role_id: UUID | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: UUID
    oidc_subject: str
    email: str
    display_name: str
    is_active: bool
    role_id: UUID
    role_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_model(cls, user) -> "UserOut":
        return cls(
            id=user.id,
            oidc_subject=user.oidc_subject,
            email=user.email,
            display_name=user.display_name,
            is_active=user.is_active,
            role_id=user.role_id,
            role_name=user.role.name if user.role else None,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
