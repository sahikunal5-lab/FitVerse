
import logging
from time import perf_counter
from uuid import UUID

import httpx

from fastapi import HTTPException
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.profile import ProfileResponse


logger = logging.getLogger("uvicorn.error")
from app.core.http_client import get_http_client

# ==========================================
# FETCH AUTHENTICATED USER PROFILE
# ==========================================

async def get_profile_by_user_id(
    user_id: UUID,
    access_token: str,
) -> ProfileResponse:

    settings = get_settings()

    # 1. Supabase PostgreSQL REST endpoint
    url = (
        f"{settings.supabase_url.rstrip('/')}"
        "/rest/v1/profiles"
    )

    # 2. Use the user's JWT so RLS remains active
    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {access_token}",
    }

    # 3. Query only the verified user's profile
    params = {
        "select": "id,full_name,created_at,updated_at",
        "id": f"eq.{user_id}",
    }

    # Start performance timer
    start = perf_counter()

    try:
        client = get_http_client()

        response = await client.get(
            url,
            headers=headers,
            params=params,
    )

        

    except httpx.TimeoutException:

        raise HTTPException(
            status_code=504,
            detail="Profile service timed out.",
        )

    except httpx.RequestError:

        raise HTTPException(
            status_code=503,
            detail="Profile service unavailable.",
        )

    finally:

        logger.info(
            "[PERFORMANCE] Profile Database: %.1f ms",
            (perf_counter() - start) * 1000,
        )

    # 5. Handle authorization errors
    if response.status_code == 401:

        raise HTTPException(
            status_code=401,
            detail="Authentication expired or invalid.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 6. Handle rate limiting
    if response.status_code == 429:

        raise HTTPException(
            status_code=503,
            detail="Profile service temporarily unavailable.",
        )

    # 7. Handle unexpected database errors
    if response.status_code != 200:

        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve profile.",
        )

    # 8. Parse returned database records
    try:
        rows = response.json()

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid profile service response.",
        )

    if not isinstance(rows, list):

        raise HTTPException(
            status_code=502,
            detail="Invalid profile service response.",
        )

    # 9. Handle missing profile
    if not rows:

        raise HTTPException(
            status_code=404,
            detail="Profile not found or not accessible.",
        )

    if len(rows) != 1:

        raise HTTPException(
            status_code=502,
            detail="Unexpected profile service response.",
        )

    # 10. Validate profile using Pydantic
    try:

        profile = ProfileResponse.model_validate(rows[0])

    except ValidationError:

        raise HTTPException(
            status_code=502,
            detail="Invalid profile data received.",
        )

    # 11. Verify database identity matches authenticated user
    if profile.id != user_id:

        raise HTTPException(
            status_code=502,
            detail="Profile identity mismatch.",
        )

    return profile
