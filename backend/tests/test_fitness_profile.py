from types import SimpleNamespace
from uuid import UUID

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import AuthenticatedUser, get_current_user
from app.repositories import fitness_profile_repository as repository

USER_A = UUID("e72c0c15-2e33-472d-81c3-cdb6f897bc5d")
USER_B = UUID("950277c7-3bce-484f-a63c-73149a19a7e4")
ENDPOINT = "/api/v1/fitness-profile"
HEADERS = {"Authorization": "Bearer test-token"}

PROFILE = {
    "user_id": str(USER_A),
    "age": 21,
    "height_cm": 175.0,
    "weight_kg": 65.0,
    "fitness_goal": "muscle_gain",
    "experience_level": "beginner",
    "activity_level": "moderately_active",
    "created_at": "2026-11-23T10:00:00Z",
    "updated_at": "2026-11-23T10:00:00Z",
}


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def authenticated_client(client):
    async def fake_current_user():
        return AuthenticatedUser(id=USER_A, email="test@example.com")

    app.dependency_overrides[get_current_user] = fake_current_user
    yield client
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
def mock_database(monkeypatch):
    state = {"status": 200, "body": [PROFILE], "raw_text": None, "calls": []}

    async def fake_request(method, access_token, params, payload=None):
        state["calls"].append(
            {"method": method, "token": access_token,
             "params": params, "payload": payload}
        )
        if state["raw_text"] is not None:
            return httpx.Response(state["status"], text=state["raw_text"])
        return httpx.Response(state["status"], json=state["body"])

    monkeypatch.setattr(repository, "request_fitness_database", fake_request)
    return state


def test_missing_bearer_token_is_rejected(client):
    response = client.get(ENDPOINT)
    assert response.status_code == 401


def test_get_saved_preferences(authenticated_client, mock_database):
    response = authenticated_client.get(ENDPOINT, headers=HEADERS)
    assert response.status_code == 200
    assert response.json()["user_id"] == str(USER_A)
    assert response.json()["fitness_goal"] == "muscle_gain"

    request = mock_database["calls"][0]
    assert request["method"] == "GET"
    assert request["token"] == "test-token"
    assert request["params"]["user_id"] == f"eq.{USER_A}"


def test_first_time_user_gets_404(authenticated_client, mock_database):
    mock_database["body"] = []
    response = authenticated_client.get(ENDPOINT, headers=HEADERS)
    assert response.status_code == 404


def test_put_saves_verified_users_preferences(authenticated_client, mock_database):
    mock_database["status"] = 201
    body = {
        "age": 21,
        "height_cm": 175,
        "weight_kg": 65,
        "fitness_goal": "muscle_gain",
        "experience_level": "beginner",
        "activity_level": "moderately_active",
    }