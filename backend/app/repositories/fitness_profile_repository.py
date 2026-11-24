
import logging
from time import perf_counter
from uuid import UUID

import httpx

from fastapi import HTTPException
from pydantic import ValidationError

from app.core.config import get_settings

from app.schemas.fitness_profile import (
    FitnessProfileInput,
    FitnessProfileResponse,
)


logger = logging.getLogger("uvicorn.error")
from app.core.http_client import get_http_client

COLUMNS = (
    "user_id,age,height_cm,weight_kg,"
    "fitness_goal,experience_level,activity_level,"
    "created_at,updated_at"
)


# ==========================================
# SEND REQUEST TO SUPABASE
# ==========================================

async def request_fitness_database(
    method: str,
    access_token: str,
    params: dict,
    payload: dict | None = None,
):

    settings = get_settings()

    url = (
        f"{settings.supabase_url.rstrip('/')}"
        "/rest/v1/fitness_profiles"
    )

    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {access_token}",
    }

    if method == "POST":
        headers["Prefer"] = (
            "resolution=merge-duplicates,"
            "return=representation"
        )

    # Start performance timer
    start = perf_counter()

    try:
        client = get_http_client()

        response = await client.request(
            method,
            url,
            headers=headers,
            params=params,
            json=payload,
    )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Fitness profile service timed out.",
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Fitness profile service unavailable.",
        )

    finally:

        logger.info(
            "[PERFORMANCE] Fitness Database %s: %.1f ms",
            method,
            (perf_counter() - start) * 1000,
        )

    return response


# ==========================================
# VALIDATE DATABASE RESPONSE
# ==========================================

def validate_database_response(
    response: httpx.Response,
    user_id: UUID,
    allow_missing: bool = False,
) -> FitnessProfileResponse:

    if response.status_code == 401:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if response.status_code == 403:
        raise HTTPException(
            status_code=403,
            detail="Fitness profile access denied.",
        )

    if response.status_code == 429:
        raise HTTPException(
            status_code=503,
            detail="Fitness profile service rate limited.",
        )

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail="Fitness profile database request failed.",
        )

    try:
        rows = response.json()

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid database response.",
        )

    if not isinstance(rows, list):
        raise HTTPException(
            status_code=502,
            detail="Invalid database response format.",
        )

    if not rows and allow_missing:
        raise HTTPException(
            status_code=404,
            detail="Fitness preferences not configured yet.",
        )

    if len(rows) != 1:
        raise HTTPException(
            status_code=502,
            detail="Unexpected fitness profile response.",
        )

    try:
        profile = FitnessProfileResponse.model_validate(
            rows[0]
        )

    except ValidationError:
        raise HTTPException(
            status_code=502,
            detail="Invalid fitness profile data.",
        )

    if profile.user_id != user_id:
        raise HTTPException(
            status_code=502,
            detail="Fitness profile identity mismatch.",
        )

    return profile


# ==========================================
# GET FITNESS PROFILE
# ==========================================

async def get_fitness_profile(
    user_id: UUID,
    access_token: str,
) -> FitnessProfileResponse:

    response = await request_fitness_database(
        method="GET",
        access_token=access_token,
        params={
            "select": COLUMNS,
            "user_id": f"eq.{user_id}",
        },
    )

    return validate_database_response(
        response,
        user_id,
        allow_missing=True,
    )


# ==========================================
# CREATE OR UPDATE FITNESS PROFILE
# ==========================================

async def save_fitness_profile(
    user_id: UUID,
    access_token: str,
    data: FitnessProfileInput,
) -> FitnessProfileResponse:

    # User ID comes from verified authentication
    payload = {
        "user_id": str(user_id),
        **data.model_dump(mode="json"),
    }

    response = await request_fitness_database(
        method="POST",
        access_token=access_token,
        params={
            "on_conflict": "user_id",
            "select": COLUMNS,
        },
        payload=payload,
    )

    return validate_database_response(
        response,
        user_id,
    )
