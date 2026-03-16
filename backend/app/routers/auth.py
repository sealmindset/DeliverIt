import uuid
from datetime import datetime, timedelta, timezone

import httpx
import jwt
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.role import Role
from app.schemas.auth import LogoutResponse, UserInfo

router = APIRouter(prefix="/auth", tags=["auth"])

# Set up OAuth client
oauth = OAuth()


async def _get_oidc_config() -> dict:
    """Fetch OIDC discovery document."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.OIDC_ISSUER_URL}/.well-known/openid-configuration",
            timeout=10.0,
        )
        resp.raise_for_status()
        return resp.json()


@router.get("/login")
async def login(request: Request):
    """Redirect user to OIDC authorization endpoint."""
    from fastapi.responses import RedirectResponse

    oidc_config = await _get_oidc_config()
    authorization_endpoint = oidc_config["authorization_endpoint"]

    # Callback goes through the frontend proxy so cookies are same-origin
    redirect_uri = f"{settings.FRONTEND_URL}/api/auth/callback"

    params = {
        "client_id": settings.OIDC_CLIENT_ID,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": redirect_uri,
        "state": uuid.uuid4().hex,
    }

    query = "&".join(f"{k}={v}" for k, v in params.items())
    authorization_url = f"{authorization_endpoint}?{query}"

    return RedirectResponse(url=authorization_url)


@router.get("/callback")
async def callback(
    request: Request,
    response: Response,
    code: str,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Exchange authorization code for tokens, look up user, set JWT cookie."""
    oidc_config = await _get_oidc_config()
    token_endpoint = oidc_config["token_endpoint"]
    userinfo_endpoint = oidc_config["userinfo_endpoint"]

    # Must match the redirect_uri sent during /login (goes through frontend proxy)
    redirect_uri = f"{settings.FRONTEND_URL}/api/auth/callback"

    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            token_endpoint,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": settings.OIDC_CLIENT_ID,
                "client_secret": settings.OIDC_CLIENT_SECRET,
            },
            timeout=10.0,
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to exchange authorization code",
            )
        token_data = token_resp.json()

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No access token returned",
        )

    # Get user info from OIDC provider
    async with httpx.AsyncClient() as client:
        userinfo_resp = await client.get(
            userinfo_endpoint,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to fetch user info",
            )
        userinfo = userinfo_resp.json()

    oidc_subject = userinfo.get("sub")
    email = userinfo.get("email", "")
    name = userinfo.get("name", userinfo.get("preferred_username", email))

    if not oidc_subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No subject in user info",
        )

    # Look up user in database by oidc_subject
    result = await db.execute(
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.oidc_subject == oidc_subject)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not provisioned. Contact your administrator.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    # Build permissions list from database role
    permissions = [
        f"{p.resource}.{p.action}" for p in user.role.permissions
    ]

    # Sign stateless JWT
    now = datetime.now(timezone.utc)
    jwt_payload = {
        "sub": oidc_subject,
        "email": user.email,
        "name": user.display_name,
        "role_id": str(user.role_id),
        "role_name": user.role.name,
        "permissions": permissions,
        "iat": now,
        "exp": now + timedelta(hours=8),
    }
    token = jwt.encode(jwt_payload, settings.JWT_SECRET, algorithm="HS256")

    # Redirect to frontend with httpOnly cookie
    from fastapi.responses import RedirectResponse

    redirect_response = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/dashboard", status_code=302
    )
    redirect_response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=8 * 60 * 60,  # 8 hours
        path="/",
    )
    return redirect_response


@router.get("/me")
async def me(user: UserInfo = Depends(get_current_user)) -> UserInfo:
    """Return decoded user info from JWT cookie."""
    return user


@router.post("/logout")
async def logout(
    response: Response,
    user: UserInfo = Depends(get_current_user),
) -> LogoutResponse:
    """Clear JWT cookie."""
    response.delete_cookie(key="token", path="/")
    return LogoutResponse(message="Logged out successfully")
