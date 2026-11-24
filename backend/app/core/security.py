
import logging

from time import perf_counter
from typing import Annotated
from uuid import UUID

import httpx
import jwt

from fastapi import Depends, HTTPException, status

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from pydantic import BaseModel, ValidationError

from app.core.config import get_settings
from app.core.http_client import get_http_client
from app.core.jwks import verify_es256_token


logger = logging.getLogger("uvicorn.error")


# ==========================================
# EXTRACT BEARER TOKEN
# ==========================================

bearer_scheme = HTTPBearer(auto_error=False)


# ==========================================
# AUTHENTICATED USER MODEL
# ==========================================

class AuthenticatedUser(BaseModel):

    id: UUID
    email: str | None = None


# ==========================================
# UNAUTHORIZED RESPONSE
# ==========================================

def unauthorized_exception():

    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )


# ==========================================
# REMOTE JWT VERIFICATION
# LEGACY HS256 SUPPORT
# ==========================================

async def verify_token_remotely(
    token: str,
) -> AuthenticatedUser:

    settings = get_settings()

    url = (
        f"{settings.supabase_url.rstrip('/')}"
        "/auth/v1/user"
    )

    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {token}",
    }

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
            "[PERFORMANCE] Supabase Auth Remote: %.1f ms",
            (perf_counter() - start) * 1000,
        )


    # Reject invalid or expired credentials

    if response.status_code in (400, 401, 403, 422):

        raise unauthorized_exception()


    # Handle rate limiting

    if response.status_code == 429:

        raise HTTPException(
            status_code=503,
            detail="Authentication service temporarily unavailable.",
        )


    # Handle upstream failures

    if response.status_code != 200:

        raise HTTPException(
            status_code=502,
            detail="Authentication verification failed.",
        )


    # Validate returned user information

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

    return current_user


# ==========================================
# MAIN AUTHENTICATION DEPENDENCY
# ==========================================

async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme),
    ],
) -> AuthenticatedUser:


    # 1. Check whether Bearer token exists

    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials
    ):

        raise unauthorized_exception()


    token = credentials.credentials


    # 2. Read JWT header
    # Header is not trusted until verification

    try:

        header = jwt.get_unverified_header(token)

    except jwt.InvalidTokenError:

        raise unauthorized_exception()


    algorithm = header.get("alg")


    # ======================================
    # 3. LOCAL ES256 VERIFICATION
    # ======================================

    if algorithm == "ES256":

        settings = get_settings()

        try:

            claims = await verify_es256_token(
                token=token,
                supabase_url=settings.supabase_url,
            )

            return AuthenticatedUser(
                id=claims["sub"],
                email=claims.get("email"),
            )

        except (
            jwt.InvalidTokenError,
            ValidationError,
            ValueError,
            TypeError,
            OverflowError,
        ):

            raise unauthorized_exception()


    # ======================================
    # 4. LEGACY HS256 VERIFICATION
    # ======================================

    if algorithm == "HS256":

        return await verify_token_remotely(token)


    # ======================================
    # 5. REJECT UNSUPPORTED ALGORITHMS
    # ======================================

    raise unauthorized_exception()
