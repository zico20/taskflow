from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def second_client(app):
    """A separate, independently-authenticated user (the future member)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/auth/signup",
            json={
                "email": "member@example.com",
                "password": "password123",
                "name": "Member",
            },
        )
        assert resp.status_code == 201
        yield ac


async def _second_user_id(second_client: AsyncClient) -> int:
    me = await second_client.get("/api/auth/me")
    return me.json()["id"]


async def _make_board(client: AsyncClient, name="Shared") -> int:
    return (await client.post("/api/boards", json={"name": name})).json()["id"]


# --- US1: invite (existing endpoint) ---


@pytest.mark.asyncio
async def test_invite_member_editor_and_viewer(auth_client, second_client):
    bid = await _make_board(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "editor"},
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "editor"
    assert resp.json()["user"]["email"] == "member@example.com"


@pytest.mark.asyncio
async def test_invite_duplicate_conflicts(auth_client, second_client):
    bid = await _make_board(auth_client)
    body = {"email": "member@example.com", "role": "editor"}
    await auth_client.post(f"/api/boards/{bid}/members", json=body)
    dup = await auth_client.post(f"/api/boards/{bid}/members", json=body)
    assert dup.status_code == 409
    assert dup.json()["code"] == "already_member"


@pytest.mark.asyncio
async def test_invite_unknown_email(auth_client):
    bid = await _make_board(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "ghost@example.com", "role": "editor"},
    )
    assert resp.status_code == 404
    assert resp.json()["code"] == "user_not_found"


@pytest.mark.asyncio
async def test_invite_owner_role_rejected(auth_client, second_client):
    bid = await _make_board(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "owner"},
    )
    assert resp.status_code == 403
    assert resp.json()["code"] == "invalid_role"


@pytest.mark.asyncio
async def test_invite_requires_owner(auth_client, second_client):
    bid = await _make_board(auth_client)
    # second_client (a stranger) cannot invite — board is hidden -> 404
    resp = await second_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "editor"},
    )
    assert resp.status_code in (403, 404)


# --- US2: edit board (existing endpoint) ---


@pytest.mark.asyncio
async def test_edit_board_details(auth_client):
    bid = await _make_board(auth_client)
    resp = await auth_client.patch(
        f"/api/boards/{bid}",
        json={"name": "Renamed", "description": "desc", "color": "#3FB950"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Renamed"
    assert body["color"] == "#3FB950"


@pytest.mark.asyncio
async def test_edit_board_rejects_empty_name(auth_client):
    bid = await _make_board(auth_client)
    resp = await auth_client.patch(f"/api/boards/{bid}", json={"name": ""})
    assert resp.status_code == 422


# --- US3: change role + remove + owner protection ---


@pytest.mark.asyncio
async def test_change_member_role(auth_client, second_client):
    bid = await _make_board(auth_client)
    uid = await _second_user_id(second_client)
    await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "editor"},
    )
    resp = await auth_client.patch(
        f"/api/boards/{bid}/members/{uid}", json={"role": "viewer"}
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "viewer"

    # The demoted viewer can no longer create a column.
    cols = (await second_client.get(f"/api/boards/{bid}/columns")).json()
    write = await second_client.post(
        f"/api/boards/{bid}/columns", json={"name": "Nope"}
    )
    assert write.status_code == 403
    assert len(cols) == 3  # default columns visible to viewer


@pytest.mark.asyncio
async def test_change_role_to_owner_rejected(auth_client, second_client):
    bid = await _make_board(auth_client)
    uid = await _second_user_id(second_client)
    await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "editor"},
    )
    resp = await auth_client.patch(
        f"/api/boards/{bid}/members/{uid}", json={"role": "owner"}
    )
    assert resp.status_code == 403
    assert resp.json()["code"] == "invalid_role"


@pytest.mark.asyncio
async def test_owner_role_protected(auth_client):
    bid = await _make_board(auth_client)
    owner_id = (await auth_client.get("/api/auth/me")).json()["id"]
    resp = await auth_client.patch(
        f"/api/boards/{bid}/members/{owner_id}", json={"role": "viewer"}
    )
    assert resp.status_code == 403
    assert resp.json()["code"] == "owner_protected"


@pytest.mark.asyncio
async def test_change_role_unknown_member(auth_client):
    bid = await _make_board(auth_client)
    resp = await auth_client.patch(
        f"/api/boards/{bid}/members/99999", json={"role": "viewer"}
    )
    assert resp.status_code == 404
    assert resp.json()["code"] == "member_not_found"


@pytest.mark.asyncio
async def test_remove_member(auth_client, second_client):
    bid = await _make_board(auth_client)
    uid = await _second_user_id(second_client)
    await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "editor"},
    )
    # member can access before removal
    assert (await second_client.get(f"/api/boards/{bid}")).status_code == 200

    resp = await auth_client.delete(f"/api/boards/{bid}/members/{uid}")
    assert resp.status_code == 204

    # after removal the board is hidden again
    assert (await second_client.get(f"/api/boards/{bid}")).status_code == 404

    # and no longer appears in the owner's member list
    detail = (await auth_client.get(f"/api/boards/{bid}")).json()
    assert all(m["user"]["id"] != uid for m in detail["members"])


@pytest.mark.asyncio
async def test_remove_owner_protected(auth_client):
    bid = await _make_board(auth_client)
    owner_id = (await auth_client.get("/api/auth/me")).json()["id"]
    resp = await auth_client.delete(f"/api/boards/{bid}/members/{owner_id}")
    assert resp.status_code == 403
    assert resp.json()["code"] == "owner_protected"


@pytest.mark.asyncio
async def test_member_endpoints_require_owner(auth_client, second_client):
    # second user is not even a member -> board hidden (404)
    bid = await _make_board(auth_client)
    uid = await _second_user_id(second_client)
    r1 = await second_client.patch(
        f"/api/boards/{bid}/members/{uid}", json={"role": "viewer"}
    )
    r2 = await second_client.delete(f"/api/boards/{bid}/members/{uid}")
    assert r1.status_code in (403, 404)
    assert r2.status_code in (403, 404)
