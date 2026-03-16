from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request, status

from app.config import settings
from app.schemas.auth import UserInfo


def get_current_user(request: Request) -> UserInfo:
    """Extract and validate JWT from httpOnly cookie named 'token'."""
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    return UserInfo(
        sub=payload["sub"],
        email=payload["email"],
        name=payload["name"],
        role_id=UUID(payload["role_id"]),
        role_name=payload["role_name"],
        permissions=payload.get("permissions", []),
    )


CurrentUser = Depends(get_current_user)
