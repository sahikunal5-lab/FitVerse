from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core import security
from app.repositories import profile_repository

USER_A = "e72c0c15-2e33-472d-81c3-cdb6f897bc5d"
USER_B = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
TOKEN = "fake-test-token"
API_PATH = "/api/v1/me"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

PROFILE_A = {
    "id": USER_A,
    "full_name": "Test User",
    "created_at": "2026-11-20T10:30:00Z",
    "updated_at": "2026-11-20T10:30:00Z",
}


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def fake_supabase(monkeypatch):
    """Mock both Supabase Auth and Data API, without external traffic."""
    settings = SimpleNamespace(
        supabase_url="https://example.supabase.co",
        supabase_publishable_key="test-publishable-key",
    )
    monkeypatch.setattr(security, "get_settings", lambda: settings)
    monkeypatch.setattr(profile_repository, "get_settings", lambda: settings)

    state = {
        "requests": [],
        "profile_status": 200,
        "profile_json": [PROFILE_A],
        "profile_raw": None,
        "profile_exception": None,
    }
    original_client = httpx.AsyncClient

    def handler(request):
        state["requests"].append(request)

        if request.url.path == "/auth/v1/user":
            return httpx.Response(200, json={"id": USER_A, "email": "test@example.com"})

        if request.url.path == "/rest/v1/profiles":
            if state["profile_exception"] == "timeout":
                raise httpx.ReadTimeout("Supabase timed out", request=request)
            if state["profile_exception"] == "connection":
                raise httpx.ConnectError("Supabase unavailable", request=request)
            if state["profile_raw"] is not None:
                return httpx.Response(
                    state["profile_status"], text=state["profile_raw"]
                )
            return httpx.Response(
                state["profile_status"], json=state["profile_json"]
            )

        raise AssertionError(f"Unexpected HTTP request: {request.url}")

    def mocked_async_client(*args, **kwargs):
        return original_client(
            *args,
            transport=httpx.MockTransport(handler),
            **kwargs,
        )

    monkeypatch.setattr(httpx, "AsyncClient", mocked_async_client)
    return state


def test_valid_profile(client, fake_supabase):
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["id"] == USER_A
    assert response.json()["full_name"] == "Test User"

    requests = fake_supabase["requests"]
    assert [r.url.path for r in requests] == [
        "/auth/v1/user", "/rest/v1/profiles"
    ]
    db_request = requests[1]
    assert db_request.url.params["id"] == f"eq.{USER_A}"
    assert db_request.headers["authorization"] == f"Bearer {TOKEN}"
    assert db_request.headers["apikey"] == "test-publishable-key"


def test_missing_token(client, fake_supabase):
    response = client.get(API_PATH)
    assert response.status_code == 401
    assert fake_supabase["requests"] == []


def test_client_cannot_choose_another_user(client, fake_supabase):
    response = client.get(f"{API_PATH}?id={USER_B}", headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["id"] == USER_A
    db_request = fake_supabase["requests"][1]
    assert db_request.url.params["id"] == f"eq.{USER_A}"


def test_missing_profile(client, fake_supabase):
    fake_supabase["profile_json"] = []
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == 404


@pytest.mark.parametrize(
    ("upstream_status", "expected_status"),
    [(401, 401), (429, 503), (403, 502), (500, 502)],
)
def test_database_error_codes(client, fake_supabase, upstream_status, expected_status):
    fake_supabase["profile_status"] = upstream_status
    fake_supabase["profile_json"] = {"message": "Simulated error"}
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == expected_status


def test_malformed_json(client, fake_supabase):
    fake_supabase["profile_raw"] = "not json"
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == 502


def test_wrong_json_shape(client, fake_supabase):
    fake_supabase["profile_json"] = {"id": USER_A}
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == 502


def test_wrong_user_profile_rejected(client, fake_supabase):
    fake_supabase["profile_json"] = [{**PROFILE_A, "id": USER_B}]
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == 502


def test_missing_profile_field(client, fake_supabase):
    fake_supabase["profile_json"] = [{
        "id": USER_A,
        "created_at": PROFILE_A["created_at"],
        "updated_at": PROFILE_A["updated_at"],
    }]
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == 502


def test_multiple_rows_rejected(client, fake_supabase):
    fake_supabase["profile_json"] = [PROFILE_A, PROFILE_A]
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == 502


@pytest.mark.parametrize(
    ("failure", "expected_status"),
    [("timeout", 504), ("connection", 503)],
)
def test_database_network_errors(client, fake_supabase, failure, expected_status):
    fake_supabase["profile_exception"] = failure
    response = client.get(API_PATH, headers=HEADERS)
    assert response.status_code == expected_status
