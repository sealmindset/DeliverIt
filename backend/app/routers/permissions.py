from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.permissions import require_permission
from app.schemas.auth import UserInfo
from app.schemas.permission import PermissionOut
from app.models.permission import Permission

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[PermissionOut])
async def list_permissions(
    user: UserInfo = require_permission("roles", "view"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Permission).order_by(Permission.resource, Permission.action)
    )
    perms = result.scalars().all()
    return [PermissionOut.model_validate(p) for p in perms]
