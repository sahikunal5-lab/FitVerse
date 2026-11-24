
import logging
from time import perf_counter
from typing import Annotated
from uuid import UUID

import httpx

from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from pydantic import BaseModel, ValidationError

from app.core.config import get_settings


logger = logging.getLogger("uvicorn.error")
from app.core.http_client import get_http_client


# Extract Bearer tokens from incoming requests
bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    id: UUID
    email: str | None = None


def unauthorized_exception():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> AuthenticatedUser:

    # 1. Check if a Bearer token exists
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials
    ):
        raise unauthorized_exception()

    token = credentials.credentials
    settings = get_settings()

    # 2. Supabase Auth verification endpoint
    url = (
        f"{settings.supabase_url.rstrip('/')}"
        "/auth/v1/user"
    )

    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {token}",
    }

    # Start performance timer
    start = perf_counter()

    try:
        client = get_http_client()

        response = await client.get(
            url,
            headers=headers,
    )
    

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Authentication service timed out.",
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable.",
        )

    finally:
        logger.info(
            "[PERFORMANCE] Supabase Auth: %.1f ms",
            (perf_counter() - start) * 1000,
        )

    # 4. Reject invalid or expired credentials
    if response.status_code in (400, 401, 403, 422):
        raise unauthorized_exception()

    # 5. Handle upstream service failures separately
    if response.status_code == 429:
        raise HTTPException(
            status_code=503,
            detail="Authentication service temporarily unavailable.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Authentication verification failed.",
        )

    # 6. Validate the returned user information
    try:
        user_data = response.json()

        current_user = AuthenticatedUser.model_validate(
            user_data
        )

    except (ValueError, TypeError, ValidationError):
        raise HTTPException(
            status_code=502,
            detail="Invalid authentication service response.",
        )

    # 7. Return the verified user
    return current_user
