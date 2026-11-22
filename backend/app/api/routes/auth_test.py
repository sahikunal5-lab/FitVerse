
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import (
    AuthenticatedUser,
    get_current_user,
)


router = APIRouter(
    tags=["Authentication"],
)


@router.get("/auth-check")
async def auth_check(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(get_current_user),
    ],
):

    return {
        "status": "authenticated",
        "user_id": str(current_user.id),
        "email": current_user.email,
    }
