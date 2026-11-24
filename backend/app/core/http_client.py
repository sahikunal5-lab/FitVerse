
from contextlib import asynccontextmanager
from http.cookiejar import CookieJar, DefaultCookiePolicy

import httpx
from fastapi import FastAPI


_http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):

    global _http_client

    async with httpx.AsyncClient(
        timeout=5.0,
        follow_redirects=False,
        limits=httpx.Limits(
            max_connections=100,
            max_keepalive_connections=20,
            keepalive_expiry=60.0,
        ),
        cookies=CookieJar(
            policy=DefaultCookiePolicy(
                allowed_domains=[]
            )
        ),
    ) as client:

        _http_client = client

        try:
            yield
        finally:
            _http_client = None


def get_http_client() -> httpx.AsyncClient:

    if _http_client is None:
        raise RuntimeError(
            "HTTP client has not been initialized."
        )

    return _http_client
