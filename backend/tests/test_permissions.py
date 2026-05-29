from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def second_client(app):
    """A separate, independently-authenticated client (different user)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/api/auth/signup",
            json={
                "email": "other@example.com",
                "password": "password123",
                "name": "Other",
            },
        )
        assert resp.status_code == 201
        yield ac


@pytest.mark.asyncio
async def test_non_member_cannot_see_board(auth_client, second_client):
    board = (
        await auth_client.post("/api/boards", json={"name": "Private"})
    ).json()
    # Second user is not a member -> 404 (existence hidden).
    resp = await second_client.get(f"/api/boards/{board['id']}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_viewer_cannot_edit(auth_client, second_client):
    board = (await auth_client.post("/api/boards", json={"name": "Shared"})).json()
    bid = board["id"]
    # Owner adds the second user as a viewer.
    add = await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "other@example.com", "role": "viewer"},
    )
    assert add.status_code == 201

    # Viewer can read columns...
    read = await second_client.get(f"/api/boards/{bid}/columns")
    assert read.status_code == 200

    # ...but cannot create a column (needs editor).
    write = await second_client.post(
        f"/api/boards/{bid}/columns", json={"name": "Nope"}
    )
    assert write.status_code == 403
    assert write.json()["code"] == "insufficient_role"


@pytest.mark.asyncio
async def test_editor_can_edit_but_not_delete_board(auth_client, second_client):
    board = (await auth_client.post("/api/boards", json={"name": "Shared2"})).json()
    bid = board["id"]
    await auth_client.post(
        f"/api/boards/{bid}/members",
        json={"email": "other@example.com", "role": "editor"},
    )
    cols = (await second_client.get(f"/api/boards/{bid}/columns")).json()

    # Editor can create a task.
    task = await second_client.post(
        f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
        json={"title": "Editor task"},
    )
    assert task.status_code == 201

    # Editor cannot delete the board (owner only).
    dele = await second_client.delete(f"/api/boards/{bid}")
    assert dele.status_code == 403


@pytest.mark.asyncio
async def test_add_member_unknown_email(auth_client):
    board = (await auth_client.post("/api/boards", json={"name": "B"})).json()
    resp = await auth_client.post(
        f"/api/boards/{board['id']}/members",
        json={"email": "ghost@example.com", "role": "editor"},
    )
    assert resp.status_code == 404
    assert resp.json()["code"] == "user_not_found"
