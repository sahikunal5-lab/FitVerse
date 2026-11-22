
from types import SimpleNamespace

import httpx
import pytest

from fastapi.testclient import TestClient

from app.main import app
from app.core import security


# ==========================================
# TEST DATA
# ==========================================

TEST_USER = {
    "id": "e72c0c15-2e33-472d-81c3-cdb6f897bc5d",
    "email": "test@example.com",
}

AUTH_ENDPOINT = "/api/v1/auth-check"

VALID_HEADERS = {
    "Authorization": "Bearer fake-valid-token"
}


# ==========================================
# 1. FASTAPI TEST CLIENT
# ==========================================

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# ==========================================
# 2. MOCK SUPABASE AUTH
# ==========================================

@pytest.fixture
def fake_supabase(monkeypatch):

    # Keep the real AsyncClient constructor
    original_client = httpx.AsyncClient

    # Replace production settings with test values
    monkeypatch.setattr(
        security,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_url="https://test.supabase.co",
            supabase_publishable_key="test-key",
        ),
    )

    def setup(
        status_code=200,
        payload=None,
        exception=None,
        raw_text=None,
    ):

        requests = []

        # Simulate Supabase's HTTP response
        def handler(request):

            requests.append(request)

            if exception is not None:
                raise exception(request)

            if raw_text is not None:
                return httpx.Response(
                    status_code,
                    text=raw_text,
                )

            return httpx.Response(
                status_code,
                json=TEST_USER if payload is None else payload,
            )

        # Replace outgoing AsyncClient network transport
        def mocked_client(*args, **kwargs):

            return original_client(
                *args,
                transport=httpx.MockTransport(handler),
                **kwargs,
            )

        monkeypatch.setattr(
            security.httpx,
            "AsyncClient",
            mocked_client,
        )

        return requests

    return setup


# ==========================================
# TEST 1 — PUBLIC HEALTH ENDPOINT
# ==========================================

def test_health_endpoint(client):

    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ==========================================
# TEST 2 — MISSING OR WRONG AUTH HEADER
# ==========================================

@pytest.mark.parametrize(
    "headers",
    [
        {},
        {"Authorization": "Basic fake-credentials"},
        {"Authorization": "Bearer"},
    ],
)
def test_missing_or_malformed_token(
    client,
    fake_supabase,
    headers,
):

    requests = fake_supabase()

    response = client.get(
        AUTH_ENDPOINT,
        headers=headers,
    )

    assert response.status_code == 401

    assert response.headers["www-authenticate"] == "Bearer"

    # No Supabase request should be necessary
    assert len(requests) == 0


# ==========================================
# TEST 3 — VALID TOKEN
# ==========================================

def test_valid_token(client, fake_supabase):

    requests = fake_supabase()

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "authenticated"
    assert data["user_id"] == TEST_USER["id"]
    assert data["email"] == TEST_USER["email"]

    # Check the request sent to Supabase
    assert len(requests) == 1

    request = requests[0]

    assert request.url.path == "/auth/v1/user"

    assert request.headers["apikey"] == "test-key"

    assert request.headers["authorization"] == (
        "Bearer fake-valid-token"
    )


# ==========================================
# TEST 4 — INVALID SUPABASE TOKEN
# ==========================================

@pytest.mark.parametrize(
    "upstream_status",
    [400, 401, 403, 422],
)
def test_invalid_token(
    client,
    fake_supabase,
    upstream_status,
):

    fake_supabase(
        status_code=upstream_status,
        payload={"message": "Invalid credentials"},
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 401


# ==========================================
# TEST 5 — EXPIRED TOKEN
# ==========================================

def test_expired_token(client, fake_supabase):

    fake_supabase(
        status_code=401,
        payload={
            "message": "JWT expired",
            "code": "bad_jwt",
        },
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 401


# ==========================================
# TEST 6 — SUPABASE RATE LIMIT
# ==========================================

def test_supabase_rate_limit(
    client,
    fake_supabase,
):

    fake_supabase(
        status_code=429,
        payload={"message": "Too many requests"},
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 503


# ==========================================
# TEST 7 — SUPABASE TIMEOUT
# ==========================================

def test_supabase_timeout(
    client,
    fake_supabase,
):

    fake_supabase(
        exception=lambda request: httpx.ReadTimeout(
            "Request timed out",
            request=request,
        ),
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 504


# ==========================================
# TEST 8 — SUPABASE CONNECTION FAILURE
# ==========================================

def test_supabase_connection_failure(
    client,
    fake_supabase,
):

    fake_supabase(
        exception=lambda request: httpx.ConnectError(
            "Connection failed",
            request=request,
        ),
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 503


# ==========================================
# TEST 9 — UNEXPECTED UPSTREAM RESPONSE
# ==========================================

def test_supabase_server_error(
    client,
    fake_supabase,
):

    fake_supabase(
        status_code=500,
        payload={"message": "Internal server error"},
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 502


# ==========================================
# TEST 10 — INVALID USER UUID
# ==========================================

def test_invalid_user_identity(
    client,
    fake_supabase,
):

    fake_supabase(
        payload={
            "id": "not-a-valid-uuid",
            "email": "test@example.com",
        },
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 502


# ==========================================
# TEST 11 — MALFORMED SUPABASE JSON
# ==========================================

def test_malformed_supabase_response(
    client,
    fake_supabase,
):

    fake_supabase(
        status_code=200,
        raw_text="This is not valid JSON",
    )

    response = client.get(
        AUTH_ENDPOINT,
        headers=VALID_HEADERS,
    )

    assert response.status_code == 502
