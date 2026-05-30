from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def second_client(app):
    """A separate, independently-authenticated user."""
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


async def _board_task(client: AsyncClient):
    board = (await client.post("/api/boards", json={"name": "T"})).json()
    bid = board["id"]
    cols = (await client.get(f"/api/boards/{bid}/columns")).json()
    task = (
        await client.post(
            f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
            json={"title": "Parent"},
        )
    ).json()
    return bid, task["id"]


async def _add_member(owner: AsyncClient, bid: int, role: str) -> None:
    await owner.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": role},
    )


@pytest.mark.asyncio
async def test_post_comment(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "Hello"}
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["content"] == "Hello"
    assert body["author"]["name"] == "Test User"
    assert "created_at" in body


@pytest.mark.asyncio
async def test_comments_ordered_oldest_first(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    for c in ("first", "second", "third"):
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": c}
        )
    items = (await auth_client.get(f"/api/boards/{bid}/tasks/{tid}/comments")).json()
    assert [i["content"] for i in items] == ["first", "second", "third"]


@pytest.mark.asyncio
async def test_empty_comment_rejected(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "   "}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_over_length_comment_rejected(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "x" * 2001}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_viewer_can_read_cannot_post(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, tid = await _board_task(auth_client)
    await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "owner says hi"}
    )
    await _add_member(auth_client, bid, "viewer")
    # Viewer reads OK
    read = await second_client.get(f"/api/boards/{bid}/tasks/{tid}/comments")
    assert read.status_code == 200
    assert read.json()[0]["content"] == "owner says hi"
    # Viewer cannot post
    post = await second_client.post(
        f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "nope"}
    )
    assert post.status_code == 403


@pytest.mark.asyncio
async def test_non_member_404(auth_client: AsyncClient, second_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await second_client.get(f"/api/boards/{bid}/tasks/{tid}/comments")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_author_can_delete_own_comment(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    comment = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "mine"}
        )
    ).json()
    resp = await auth_client.delete(
        f"/api/boards/{bid}/tasks/{tid}/comments/{comment['id']}"
    )
    assert resp.status_code == 204
    listed = (await auth_client.get(f"/api/boards/{bid}/tasks/{tid}/comments")).json()
    assert listed == []


@pytest.mark.asyncio
async def test_editor_cannot_delete_others_comment(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, tid = await _board_task(auth_client)
    # Owner posts a comment.
    comment = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "owners"}
        )
    ).json()
    # member joins as editor and tries to delete the owner's comment.
    await _add_member(auth_client, bid, "editor")
    resp = await second_client.delete(
        f"/api/boards/{bid}/tasks/{tid}/comments/{comment['id']}"
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_owner_can_delete_others_comment(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, tid = await _board_task(auth_client)
    # member joins as editor and posts a comment.
    await _add_member(auth_client, bid, "editor")
    comment = (
        await second_client.post(
            f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "members"}
        )
    ).json()
    # Board owner (auth_client) can moderate it.
    resp = await auth_client.delete(
        f"/api/boards/{bid}/tasks/{tid}/comments/{comment['id']}"
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_missing_comment_404(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await auth_client.delete(
        f"/api/boards/{bid}/tasks/{tid}/comments/99999"
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_cascades_comments(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/comments", json={"content": "a"}
    )
    await auth_client.delete(f"/api/boards/{bid}/tasks/{tid}")
    resp = await auth_client.get(f"/api/boards/{bid}/tasks/{tid}/comments")
    assert resp.status_code == 404
