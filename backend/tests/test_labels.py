from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture
async def second_client(app):
    """A separate, independently-authenticated user (used as a viewer)."""
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


async def _board_with_columns(client: AsyncClient):
    board = (
        await client.post("/api/boards", json={"name": "T", "color": "#fff"})
    ).json()
    cols = (await client.get(f"/api/boards/{board['id']}/columns")).json()
    return board, cols


async def _add_viewer(owner: AsyncClient, bid: int) -> None:
    await owner.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "viewer"},
    )


# --- US2: create labels ---


@pytest.mark.asyncio
async def test_create_label(auth_client: AsyncClient):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    resp = await auth_client.post(
        f"/api/boards/{bid}/labels", json={"name": "Bug", "color": "#F85149"}
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Bug"
    assert body["color"] == "#F85149"
    assert body["board_id"] == bid


@pytest.mark.asyncio
async def test_create_label_default_color(auth_client: AsyncClient):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    resp = await auth_client.post(f"/api/boards/{bid}/labels", json={"name": "Plain"})
    assert resp.status_code == 201, resp.text
    assert resp.json()["color"] == "#58A6FF"


@pytest.mark.asyncio
async def test_create_label_duplicate_same_case(auth_client: AsyncClient):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    body = {"name": "Bug", "color": "#F85149"}
    await auth_client.post(f"/api/boards/{bid}/labels", json=body)
    dup = await auth_client.post(f"/api/boards/{bid}/labels", json=body)
    assert dup.status_code == 409
    assert dup.json()["code"] == "label_name_taken"


@pytest.mark.asyncio
async def test_create_label_duplicate_case_insensitive(auth_client: AsyncClient):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    await auth_client.post(f"/api/boards/{bid}/labels", json={"name": "Bug"})
    dup = await auth_client.post(f"/api/boards/{bid}/labels", json={"name": "bug"})
    assert dup.status_code == 409
    assert dup.json()["code"] == "label_name_taken"


@pytest.mark.asyncio
async def test_create_label_empty_name_rejected(auth_client: AsyncClient):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    resp = await auth_client.post(f"/api/boards/{bid}/labels", json={"name": ""})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_label_viewer_forbidden(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    await _add_viewer(auth_client, bid)
    resp = await second_client.post(
        f"/api/boards/{bid}/labels", json={"name": "Nope"}
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_labels_are_board_scoped(auth_client: AsyncClient):
    b1 = (await auth_client.post("/api/boards", json={"name": "B1"})).json()["id"]
    b2 = (await auth_client.post("/api/boards", json={"name": "B2"})).json()["id"]
    await auth_client.post(f"/api/boards/{b1}/labels", json={"name": "OnlyB1"})
    listed = (await auth_client.get(f"/api/boards/{b2}/labels")).json()
    assert all(label["name"] != "OnlyB1" for label in listed)


# --- US1: apply labels to a task (existing path) ---


@pytest.mark.asyncio
async def test_apply_label_to_task(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid = board["id"]
    label = (
        await auth_client.post(f"/api/boards/{bid}/labels", json={"name": "bug"})
    ).json()
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
        json={"title": "Labeled", "label_ids": [label["id"]]},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["labels"][0]["name"] == "bug"


@pytest.mark.asyncio
async def test_apply_cross_board_label_ignored(auth_client: AsyncClient):
    """A label id from another board is not applied (board-scoped validation)."""
    board, cols = await _board_with_columns(auth_client)
    bid = board["id"]
    other = (await auth_client.post("/api/boards", json={"name": "Other"})).json()["id"]
    foreign = (
        await auth_client.post(f"/api/boards/{other}/labels", json={"name": "x"})
    ).json()
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
        json={"title": "T", "label_ids": [foreign["id"]]},
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["labels"] == []


# --- US3: delete labels ---


@pytest.mark.asyncio
async def test_delete_label_removes_it(auth_client: AsyncClient):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    label = (
        await auth_client.post(f"/api/boards/{bid}/labels", json={"name": "Temp"})
    ).json()
    resp = await auth_client.delete(f"/api/boards/{bid}/labels/{label['id']}")
    assert resp.status_code == 204
    listed = (await auth_client.get(f"/api/boards/{bid}/labels")).json()
    assert all(item["id"] != label["id"] for item in listed)


@pytest.mark.asyncio
async def test_delete_label_cascades_off_tasks(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid = board["id"]
    label = (
        await auth_client.post(f"/api/boards/{bid}/labels", json={"name": "Gone"})
    ).json()
    task = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
            json={"title": "Has label", "label_ids": [label["id"]]},
        )
    ).json()
    assert len(task["labels"]) == 1

    await auth_client.delete(f"/api/boards/{bid}/labels/{label['id']}")

    fetched = (
        await auth_client.get(f"/api/boards/{bid}/tasks/{task['id']}")
    ).json()
    assert fetched["labels"] == []


@pytest.mark.asyncio
async def test_delete_missing_label_404(auth_client: AsyncClient):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    resp = await auth_client.delete(f"/api/boards/{bid}/labels/99999")
    assert resp.status_code == 404
    assert resp.json()["code"] == "label_not_found"


@pytest.mark.asyncio
async def test_delete_cross_board_label_404(auth_client: AsyncClient):
    b1 = (await auth_client.post("/api/boards", json={"name": "B1"})).json()["id"]
    b2 = (await auth_client.post("/api/boards", json={"name": "B2"})).json()["id"]
    label = (
        await auth_client.post(f"/api/boards/{b1}/labels", json={"name": "L"})
    ).json()
    # Try to delete b1's label via b2's path.
    resp = await auth_client.delete(f"/api/boards/{b2}/labels/{label['id']}")
    assert resp.status_code == 404
    assert resp.json()["code"] == "label_not_found"


@pytest.mark.asyncio
async def test_delete_label_viewer_forbidden(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid = (await auth_client.post("/api/boards", json={"name": "B"})).json()["id"]
    label = (
        await auth_client.post(f"/api/boards/{bid}/labels", json={"name": "L"})
    ).json()
    await _add_viewer(auth_client, bid)
    resp = await second_client.delete(f"/api/boards/{bid}/labels/{label['id']}")
    assert resp.status_code == 403
