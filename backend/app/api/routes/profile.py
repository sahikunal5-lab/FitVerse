
from typing import Annotated

from fastapi import APIRouter, Depends

from fastapi.security import (
    HTTPAuthorizationCredentials,
)

from app.core.security import (
    AuthenticatedUser,
    get_current_user,
    bearer_scheme,
    unauthorized_exception,
)

from app.repositories.profile_repository import (
    get_profile_by_user_id,
)

from app.schemas.profile import ProfileResponse


router = APIRouter(
    tags=["Profile"],
)


# ==========================================
# GET CURRENT AUTHENTICATED USER PROFILE
# ==========================================

@router.get(
    "/me",
    response_model=ProfileResponse,
)
async def get_my_profile(

    current_user: Annotated[
        AuthenticatedUser,
        Depends(get_current_user),
    ],

    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],

):

    # Authentication dependency already verifies the token
    if credentials is None:
        raise unauthorized_exception()

    # Use the verified user ID, never a client-supplied ID
    profile = await get_profile_by_user_id(
        user_id=current_user.id,
        access_token=credentials.credentials,
    )

    return profile
