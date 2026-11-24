
import json
import time

from types import SimpleNamespace

import httpx
import jwt
import pytest

from jwt.algorithms import ECAlgorithm
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient

from app.main import app
from app.core import security, jwks


SUPABASE_URL = "https://test.supabase.co"
ISSUER = f"{SUPABASE_URL}/auth/v1"

USER_ID = "e72c0c15-2e33-472d-81c3-cdb6f897bc5d"

KEY_ID = "test-signing-key"

API_PATH = "/api/v1/auth-check"


# ==========================================
# GENERATE TEST PUBLIC KEY
# ==========================================

def make_public_jwk(private_key, kid):

    public_key = json.loads(
        ECAlgorithm.to_jwk(
            private_key.public_key()
        )
    )

    public_key.update({
        "kid": kid,
        "alg": "ES256",
        "use": "sig",
    })

    return public_key

# ==========================================
# TEST ENVIRONMENT
# ==========================================

@pytest.fixture
def environment(monkeypatch):

    private_key = ec.generate_private_key(
        ec.SECP256R1()
    )

    cache = jwks.JWKSCache()

    monkeypatch.setattr(
        jwks,
        "jwks_cache",
        cache,
    )

    monkeypatch.setattr(
        security,
        "get_settings",
        lambda: SimpleNamespace(
            supabase_url=SUPABASE_URL,
            supabase_publishable_key="test-key",
        ),
    )

    state = {
        "requests": [],
        "status": 200,
        "keys": [
            make_public_jwk(private_key, KEY_ID)
        ],
        "failure": None,
    }

    def handler(request):

        state["requests"].append(request)

        assert str(request.url) == (
            f"{ISSUER}/.well-known/jwks.json"
        )

        if state["failure"] == "timeout":
            raise httpx.ReadTimeout(
                "Test timeout",
                request=request,
            )

        if state["failure"] == "connection":
            raise httpx.ConnectError(
                "Test connection failure",
                request=request,
            )

        return httpx.Response(
            state["status"],
            json={"keys": state["keys"]},
        )

    original_send = httpx.AsyncClient.send

    async def mocked_send(self, request, **kwargs):

        async with httpx.AsyncClient(
            transport=httpx.MockTransport(handler)
        ) as mock_client:

            return await original_send(
                mock_client,
                request,
                **kwargs,
            )

    monkeypatch.setattr(
        httpx.AsyncClient,
        "send",
        mocked_send,
    )

    with TestClient(app) as client:

        yield SimpleNamespace(
            client=client,
            private_key=private_key,
            cache=cache,
            state=state,
        )


# ==========================================
# GENERATE TEST JWT
# ==========================================

def make_token(
    environment,
    overrides=None,
    private_key=None,
    kid=KEY_ID,
    remove_claim=None,
):

    now = int(time.time())

    claims = {
        "sub": USER_ID,
        "email": "test@example.com",
        "iss": ISSUER,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": now,
        "exp": now + 3600,
    }

    if overrides:
        claims.update(overrides)

    if remove_claim:
        claims.pop(remove_claim, None)

    return jwt.encode(
        claims,
        private_key or environment.private_key,
        algorithm="ES256",
        headers={"kid": kid},
    )


def call_api(environment, token):

    return environment.client.get(
        API_PATH,
        headers={
            "Authorization": f"Bearer {token}"
        },
    )


# ==========================================
# TEST 1 — VALID ES256 TOKEN
# ==========================================

def test_valid_es256_token(environment):

    token = make_token(environment)

    response = call_api(environment, token)

    assert response.status_code == 200
    assert response.json()["user_id"] == USER_ID
    assert response.json()["email"] == "test@example.com"

    assert len(environment.state["requests"]) == 1


# ==========================================
# TEST 2 — JWKS CACHE REUSE
# ==========================================

def test_jwks_cache_reuse(environment):

    token = make_token(environment)

    for _ in range(5):

        response = call_api(environment, token)

        assert response.status_code == 200

    # Only one JWKS network request

    assert len(environment.state["requests"]) == 1


# ==========================================
# TEST 3 — INVALID SIGNATURE
# ==========================================

def test_invalid_signature(environment):

    attacker_key = ec.generate_private_key(
        ec.SECP256R1()
    )

    token = make_token(
        environment,
        private_key=attacker_key,
    )

    response = call_api(environment, token)

    assert response.status_code == 401


# ==========================================
# TEST 4 — MODIFIED SIGNATURE
# ==========================================

def test_tampered_token(environment):

    token = make_token(environment)

    header, payload, signature = token.split(".")

    replacement = (
        "A" if signature[0] != "A" else "B"
    )

    modified_signature = replacement + signature[1:]

    tampered_token = (
        f"{header}.{payload}.{modified_signature}"
    )

    response = call_api(
        environment,
        tampered_token,
    )

    assert response.status_code == 401


# ==========================================
# TEST 5 — INVALID JWT CLAIMS
# ==========================================

@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": 1},
        {"iat": 4102444800},
        {"nbf": 4102444800},
        {"iss": "https://another-project.supabase.co/auth/v1"},
        {"aud": "wrong-audience"},
        {"role": "anon"},
        {"sub": "invalid-uuid"},
    ],
)
def test_invalid_claims(environment, overrides):

    token = make_token(
        environment,
        overrides=overrides,
    )

    response = call_api(environment, token)

    assert response.status_code == 401


# ==========================================
# TEST 6 — MISSING REQUIRED CLAIMS
# ==========================================

@pytest.mark.parametrize(
    "claim",
    ["exp", "iat", "iss", "aud", "sub", "role"],
)
def test_missing_claims(environment, claim):

    token = make_token(
        environment,
        remove_claim=claim,
    )

    response = call_api(environment, token)

    assert response.status_code == 401


# ==========================================
# TEST 7 — UNKNOWN SIGNING KEY
# ==========================================

def test_unknown_signing_key(environment):

    token = make_token(
        environment,
        kid="unknown-key",
    )

    response = call_api(environment, token)

    assert response.status_code == 401


# ==========================================
# TEST 8 — UNSIGNED JWT
# ==========================================

def test_unsigned_token(environment):

    token = jwt.encode(
        {"sub": USER_ID},
        key="",
        algorithm="none",
    )

    response = call_api(environment, token)

    assert response.status_code == 401

    assert environment.state["requests"] == []


# ==========================================
# TEST 9 — EXPIRED JWKS CACHE
# ==========================================

def test_expired_cache_refresh(environment):

    token = make_token(environment)

    assert call_api(
        environment, token
    ).status_code == 200

    # Simulate cache expiration

    environment.cache._expires_at = 0

    assert call_api(
        environment, token
    ).status_code == 200

    assert len(environment.state["requests"]) == 2


# ==========================================
# TEST 10 — SIGNING KEY ROTATION
# ==========================================

def test_key_rotation(environment):

    token = make_token(environment)

    assert call_api(
        environment, token
    ).status_code == 200

    new_private_key = ec.generate_private_key(
        ec.SECP256R1()
    )

    new_kid = "rotated-signing-key"

    environment.state["keys"].append(
        make_public_jwk(
            new_private_key,
            new_kid,
        )
    )

    # Simulate elapsed refresh cooldown

    environment.cache._last_refresh -= (
        jwks.JWKS_REFRESH_COOLDOWN + 1
    )

    new_token = make_token(
        environment,
        private_key=new_private_key,
        kid=new_kid,
    )

    response = call_api(
        environment,
        new_token,
    )

    assert response.status_code == 200

    assert len(environment.state["requests"]) == 2


# ==========================================
# TEST 11 — JWKS SERVICE ERRORS
# ==========================================

@pytest.mark.parametrize(
    ("failure", "expected_status"),
    [
        ("timeout", 504),
        ("connection", 503),
    ],
)
def test_jwks_network_errors(
    environment,
    failure,
    expected_status,
):

    environment.state["failure"] = failure

    token = make_token(environment)

    response = call_api(environment, token)

    assert response.status_code == expected_status


def test_jwks_server_error(environment):

    environment.state["status"] = 500

    token = make_token(environment)

    response = call_api(environment, token)

    assert response.status_code == 503


# ==========================================
# TEST 12 — MALFORMED JWKS
# ==========================================

def test_invalid_jwks(environment):

    environment.state["keys"] = [
        {"invalid": "key"}
    ]

    token = make_token(environment)

    response = call_api(environment, token)

    assert response.status_code == 502
