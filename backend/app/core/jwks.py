
import asyncio
import logging

from time import monotonic, perf_counter
from uuid import UUID

import httpx
import jwt

from fastapi import HTTPException

from app.core.http_client import get_http_client


logger = logging.getLogger("uvicorn.error")


# ==========================================
# CACHE CONFIGURATION
# ==========================================

JWKS_CACHE_TTL = 300
JWKS_REFRESH_COOLDOWN = 30

ALLOWED_ALGORITHM = "ES256"
EXPECTED_AUDIENCE = "authenticated"


# ==========================================
# JWKS PUBLIC KEY CACHE
# ==========================================

class JWKSCache:

    def __init__(self):

        self._keys = {}

        self._issuer = None

        self._expires_at = 0.0

        self._last_refresh = 0.0

        self._lock = asyncio.Lock()


    # ======================================
    # DOWNLOAD PUBLIC KEYS FROM SUPABASE
    # ======================================

    async def _refresh(self, issuer: str):

        url = f"{issuer}/.well-known/jwks.json"

        client = get_http_client()

        start = perf_counter()

        try:

            response = await client.get(url)

        except httpx.TimeoutException:

            raise HTTPException(
                status_code=504,
                detail="Signing key service timed out.",
            )

        except httpx.RequestError:

            raise HTTPException(
                status_code=503,
                detail="Signing key service unavailable.",
            )

        finally:

            logger.info(
                "[PERFORMANCE] JWKS Fetch: %.1f ms",
                (perf_counter() - start) * 1000,
            )


        # Check upstream response

        if response.status_code != 200:

            raise HTTPException(
                status_code=503,
                detail="Unable to retrieve signing keys.",
            )


        # Parse public keys

        try:

            data = response.json()

            if not isinstance(data, dict):
                raise ValueError("Invalid JWKS response.")

            raw_keys = data.get("keys")

            if not isinstance(raw_keys, list):
                raise ValueError("Invalid signing key list.")

            parsed_keys = {}

            for raw_key in raw_keys:

                if not isinstance(raw_key, dict):
                    continue

                # Accept only ES256 public signing keys

                if raw_key.get("kty") != "EC":
                    continue

                if raw_key.get("crv") != "P-256":
                    continue

                if raw_key.get("alg") != ALLOWED_ALGORITHM:
                    continue

                if raw_key.get("use", "sig") != "sig":
                    continue

                if "d" in raw_key:
                    continue

                kid = raw_key.get("kid")

                if not isinstance(kid, str) or not kid:
                    continue

                if kid in parsed_keys:
                    raise ValueError("Duplicate signing key ID.")

                public_key = jwt.PyJWK.from_dict(
                    raw_key,
                    algorithm=ALLOWED_ALGORITHM,
                )

                parsed_keys[kid] = public_key.key

            if not parsed_keys:

                raise ValueError(
                    "No supported signing keys found."
                )

        except (ValueError, TypeError, KeyError, jwt.PyJWTError):

            raise HTTPException(
                status_code=502,
                detail="Invalid signing key response.",
            )


        # Update the cache after successful validation

        self._keys = parsed_keys

        self._issuer = issuer

        self._last_refresh = monotonic()

        self._expires_at = (
            self._last_refresh + JWKS_CACHE_TTL
        )

        logger.info(
            "[JWKS] Cached %d public signing key(s)",
            len(parsed_keys),
        )


    # ======================================
    # GET A SIGNING KEY FROM CACHE
    # ======================================

    async def get_key(self, issuer: str, kid: str):

        now = monotonic()

        # Return a valid cached key immediately

        if (
            self._issuer == issuer
            and now < self._expires_at
            and kid in self._keys
        ):

            return self._keys[kid]


        # Prevent simultaneous cache refreshes

        async with self._lock:

            now = monotonic()

            cache_valid = (
                self._issuer == issuer
                and now < self._expires_at
            )

            if cache_valid and kid in self._keys:

                return self._keys[kid]


            # Avoid repeatedly downloading JWKS
            # for unknown or randomly generated key IDs

            if (
                cache_valid
                and now - self._last_refresh
                < JWKS_REFRESH_COOLDOWN
            ):

                raise jwt.InvalidTokenError(
                    "Unknown signing key."
                )


            # Cache expired, missing key or first request

            await self._refresh(issuer)

            public_key = self._keys.get(kid)

            if public_key is None:

                raise jwt.InvalidTokenError(
                    "Unknown signing key."
                )

            return public_key


# One cache instance per backend process

jwks_cache = JWKSCache()


# ==========================================
# VERIFY ES256 JWT LOCALLY
# ==========================================

async def verify_es256_token(
    token: str,
    supabase_url: str,
) -> dict:

    start = perf_counter()

    try:

        # 1. Read JWT header
        # Header information is not yet trusted

        header = jwt.get_unverified_header(token)


        # 2. Reject unsupported signing algorithms

        if header.get("alg") != ALLOWED_ALGORITHM:

            raise jwt.InvalidAlgorithmError(
                "Unsupported signing algorithm."
            )


        # 3. Extract signing key ID

        kid = header.get("kid")

        if not isinstance(kid, str) or not kid:

            raise jwt.InvalidTokenError(
                "Missing signing key ID."
            )


        # 4. Build trusted issuer from backend settings

        issuer = (
            f"{supabase_url.rstrip('/')}/auth/v1"
        )


        # 5. Get cached public key

        public_key = await jwks_cache.get_key(
            issuer,
            kid,
        )


        # 6. Verify signature and required JWT claims

        claims = jwt.decode(
            token,
            key=public_key,
            algorithms=[ALLOWED_ALGORITHM],
            audience=EXPECTED_AUDIENCE,
            issuer=issuer,
            options={
                "require": [
                    "exp",
                    "iat",
                    "iss",
                    "aud",
                    "sub",
                    "role",
                ],
            },
        )


        # 7. Accept only authenticated user tokens

        if claims.get("role") != "authenticated":

            raise jwt.InvalidTokenError(
                "Invalid user role."
            )


        # 8. Validate the authenticated user ID

        try:

            UUID(claims["sub"])

        except (ValueError, TypeError, AttributeError):

            raise jwt.InvalidTokenError(
                "Invalid user identity."
            )


        # 9. Return verified claims

        return claims

    finally:

        logger.info(
            "[PERFORMANCE] Local JWT Verification: %.2f ms",
            (perf_counter() - start) * 1000,
        )
