from uuid import UUID

from pydantic import BaseModel


class UserInfo(BaseModel):
    sub: str
    email: str
    name: str
    role_id: UUID
    role_name: str
    permissions: list[str]


class LoginResponse(BaseModel):
    authorization_url: str


class LogoutResponse(BaseModel):
    message: str
