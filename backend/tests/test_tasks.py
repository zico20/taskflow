from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _board_with_columns(client: AsyncClient):
    board = (
        await client.post("/api/boards", json={"name": "T", "color": "#fff"})
    ).json()
    cols = (await client.get(f"/api/boards/{board['id']}/columns")).json()
    return board, cols


async def _create_task(client, bid, column_id, title):
    return await client.post(
        f"/api/boards/{bid}/tasks?column_id={column_id}",
        json={"title": title, "priority": "high"},
    )


@pytest.mark.asyncio
async def test_create_task(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid = board["id"]
    resp = await _create_task(auth_client, bid, cols[0]["id"], "First task")
    assert resp.status_code == 201, resp.text
    task = resp.json()
    assert task["title"] == "First task"
    assert task["priority"] == "high"
    assert task["column_id"] == cols[0]["id"]


@pytest.mark.asyncio
async def test_create_task_requires_title(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{board['id']}/tasks?column_id={cols[0]['id']}",
        json={"priority": "low"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_update_and_delete_task(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid = board["id"]
    task = (await _create_task(auth_client, bid, cols[0]["id"], "Edit me")).json()

    upd = await auth_client.patch(
        f"/api/boards/{bid}/tasks/{task['id']}",
        json={"title": "Edited", "priority": "low"},
    )
    assert upd.status_code == 200
    assert upd.json()["title"] == "Edited"
    assert upd.json()["priority"] == "low"

    dele = await auth_client.delete(f"/api/boards/{bid}/tasks/{task['id']}")
    assert dele.status_code == 204
    gone = await auth_client.get(f"/api/boards/{bid}/tasks/{task['id']}")
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_board_snapshot_returns_columns_with_tasks(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid = board["id"]
    await _create_task(auth_client, bid, cols[0]["id"], "A")
    await _create_task(auth_client, bid, cols[0]["id"], "B")

    snap = await auth_client.get(f"/api/boards/{bid}/tasks")
    assert snap.status_code == 200
    data = snap.json()
    assert data["board_id"] == bid
    first_col = next(c for c in data["columns"] if c["id"] == cols[0]["id"])
    titles = [t["title"] for t in first_col["tasks"]]
    assert titles == ["A", "B"]


@pytest.mark.asyncio
async def test_move_task_within_column_reorders(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid, col0 = board["id"], cols[0]["id"]
    await _create_task(auth_client, bid, col0, "1")
    await _create_task(auth_client, bid, col0, "2")
    t3 = (await _create_task(auth_client, bid, col0, "3")).json()

    # Move task 3 to the front (index 0).
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{t3['id']}/move",
        json={"column_id": col0, "position": 0},
    )
    assert resp.status_code == 200

    snap = await auth_client.get(f"/api/boards/{bid}/tasks")
    first_col = next(c for c in snap.json()["columns"] if c["id"] == col0)
    order = [t["title"] for t in first_col["tasks"]]
    assert order == ["3", "1", "2"]


@pytest.mark.asyncio
async def test_move_task_across_columns(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid, col0, col1 = board["id"], cols[0]["id"], cols[1]["id"]
    a = (await _create_task(auth_client, bid, col0, "A")).json()
    (await _create_task(auth_client, bid, col1, "X")).json()

    # Move A into col1 at index 0.
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{a['id']}/move",
        json={"column_id": col1, "position": 0},
    )
    assert resp.status_code == 200
    assert resp.json()["column_id"] == col1

    snap = await auth_client.get(f"/api/boards/{bid}/tasks")
    cmap = {c["id"]: [t["title"] for t in c["tasks"]] for c in snap.json()["columns"]}
    assert cmap[col0] == []
    assert cmap[col1] == ["A", "X"]


@pytest.mark.asyncio
async def test_task_with_labels(auth_client: AsyncClient):
    board, cols = await _board_with_columns(auth_client)
    bid = board["id"]
    label = (
        await auth_client.post(
            f"/api/boards/{bid}/labels", json={"name": "bug", "color": "#f00"}
        )
    ).json()
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
        json={"title": "Labeled", "label_ids": [label["id"]]},
    )
    assert resp.status_code == 201
    assert resp.json()["labels"][0]["name"] == "bug"
