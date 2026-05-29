from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.config import settings


@pytest.mark.asyncio
async def test_signup_sets_cookie_and_returns_user(client: AsyncClient):
    resp = await client.post(
        "/api/auth/signup",
        json={"email": "a@example.com", "password": "password123", "name": "Alice"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["email"] == "a@example.com"
    assert body["name"] == "Alice"
    assert "password" not in body
    assert settings.COOKIE_NAME in resp.cookies


@pytest.mark.asyncio
async def test_signup_duplicate_email_conflicts(client: AsyncClient):
    payload = {"email": "dup@example.com", "password": "password123", "name": "Dup"}
    await client.post("/api/auth/signup", json=payload)
    resp = await client.post("/api/auth/signup", json=payload)
    assert resp.status_code == 409
    body = resp.json()
    assert body["code"] == "email_taken"
    assert "error" in body


@pytest.mark.asyncio
async def test_login_success_and_failure(client: AsyncClient):
    await client.post(
        "/api/auth/signup",
        json={"email": "b@example.com", "password": "password123", "name": "Bob"},
    )
    # wrong password
    bad = await client.post(
        "/api/auth/login",
        json={"email": "b@example.com", "password": "wrongpass"},
    )
    assert bad.status_code == 401
    assert bad.json()["code"] == "invalid_credentials"
    # correct password
    ok = await client.post(
        "/api/auth/login",
        json={"email": "b@example.com", "password": "password123"},
    )
    assert ok.status_code == 200
    assert settings.COOKIE_NAME in ok.cookies


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_current_user(auth_client: AsyncClient):
    resp = await auth_client.get("/api/auth/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == "owner@example.com"


@pytest.mark.asyncio
async def test_logout_clears_cookie(auth_client: AsyncClient):
    resp = await auth_client.post("/api/auth/logout")
    assert resp.status_code == 200
    # After logout the cookie is cleared; /me should fail.
    me = await auth_client.get("/api/auth/me")
    assert me.status_code == 401


@pytest.mark.asyncio
async def test_password_reset_request_is_generic(client: AsyncClient):
    # Unknown email still returns 200 (no user enumeration).
    resp = await client.post(
        "/api/auth/password-reset/request", json={"email": "nobody@example.com"}
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_password_reset_confirm_invalid_token(client: AsyncClient):
    resp = await client.post(
        "/api/auth/password-reset/confirm",
        json={"token": "not-a-real-token", "new_password": "newpassword123"},
    )
    assert resp.status_code == 401
    assert resp.json()["code"] == "invalid_token"
