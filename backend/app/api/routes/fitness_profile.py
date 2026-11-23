
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

from app.repositories.fitness_profile_repository import (
    get_fitness_profile,
    save_fitness_profile,
)

from app.schemas.fitness_profile import (
    FitnessProfileInput,
    FitnessProfileResponse,
)


router = APIRouter(
    tags=["Fitness Preferences"],
)


# ==========================================
# GET CURRENT USER FITNESS PROFILE
# ==========================================

@router.get(
    "/fitness-profile",
    response_model=FitnessProfileResponse,
)
async def read_my_fitness_profile(

    current_user: Annotated[
        AuthenticatedUser,
        Depends(get_current_user),
    ],

    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],

):

    if credentials is None:
        raise unauthorized_exception()

    return await get_fitness_profile(
        user_id=current_user.id,
        access_token=credentials.credentials,
    )


# ==========================================
# CREATE OR UPDATE FITNESS PROFILE
# ==========================================

@router.put(
    "/fitness-profile",
    response_model=FitnessProfileResponse,
)
async def update_my_fitness_profile(

    data: FitnessProfileInput,

    current_user: Annotated[
        AuthenticatedUser,
        Depends(get_current_user),
    ],

    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],

):

    if credentials is None:
        raise unauthorized_exception()

    return await save_fitness_profile(
        user_id=current_user.id,
        access_token=credentials.credentials,
        data=data,
    )
