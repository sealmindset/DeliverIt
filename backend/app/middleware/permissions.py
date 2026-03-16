from fastapi import Depends, HTTPException, status

from app.middleware.auth import get_current_user
from app.schemas.auth import UserInfo


def require_permission(resource: str, action: str):
    """FastAPI dependency that checks the user's JWT permissions list."""

    def checker(user: UserInfo = Depends(get_current_user)) -> UserInfo:
        permission_key = f"{resource}.{action}"
        if permission_key not in user.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {permission_key}",
            )
        return user

    return Depends(checker)
