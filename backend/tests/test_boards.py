from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _create_board(client: AsyncClient, name="My Board"):
    return await client.post(
        "/api/boards", json={"name": name, "description": "d", "color": "#58A6FF"}
    )


@pytest.mark.asyncio
async def test_create_board_creates_default_columns(auth_client: AsyncClient):
    resp = await _create_board(auth_client)
    assert resp.status_code == 201, resp.text
    board = resp.json()
    assert board["name"] == "My Board"

    cols = await auth_client.get(f"/api/boards/{board['id']}/columns")
    assert cols.status_code == 200
    names = [c["name"] for c in cols.json()]
    assert names == ["To Do", "In Progress", "Done"]


@pytest.mark.asyncio
async def test_list_boards_includes_role_and_task_count(auth_client: AsyncClient):
    await _create_board(auth_client, "B1")
    resp = await auth_client.get("/api/boards")
    assert resp.status_code == 200
    boards = resp.json()
    assert len(boards) == 1
    assert boards[0]["role"] == "owner"
    assert boards[0]["task_count"] == 0


@pytest.mark.asyncio
async def test_get_board_detail_includes_owner_member(auth_client: AsyncClient):
    board = (await _create_board(auth_client)).json()
    resp = await auth_client.get(f"/api/boards/{board['id']}")
    assert resp.status_code == 200
    detail = resp.json()
    assert detail["role"] == "owner"
    assert len(detail["members"]) == 1
    assert detail["members"][0]["role"] == "owner"


@pytest.mark.asyncio
async def test_update_board(auth_client: AsyncClient):
    board = (await _create_board(auth_client)).json()
    resp = await auth_client.patch(
        f"/api/boards/{board['id']}", json={"name": "Renamed"}
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed"


@pytest.mark.asyncio
async def test_delete_board(auth_client: AsyncClient):
    board = (await _create_board(auth_client)).json()
    resp = await auth_client.delete(f"/api/boards/{board['id']}")
    assert resp.status_code == 204
    gone = await auth_client.get(f"/api/boards/{board['id']}")
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_board_requires_auth(client: AsyncClient):
    resp = await client.get("/api/boards")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_columns_crud_and_reorder(auth_client: AsyncClient):
    board = (await _create_board(auth_client)).json()
    bid = board["id"]

    # add a custom column
    created = await auth_client.post(
        f"/api/boards/{bid}/columns", json={"name": "Backlog"}
    )
    assert created.status_code == 201
    new_col = created.json()

    cols = (await auth_client.get(f"/api/boards/{bid}/columns")).json()
    assert len(cols) == 4

    # rename
    renamed = await auth_client.patch(
        f"/api/boards/{bid}/columns/{new_col['id']}", json={"name": "Ideas"}
    )
    assert renamed.status_code == 200
    assert renamed.json()["name"] == "Ideas"

    # reorder (reverse)
    ids = [c["id"] for c in cols][::-1]
    reordered = await auth_client.post(
        f"/api/boards/{bid}/columns/reorder", json={"column_ids": ids}
    )
    assert reordered.status_code == 200
    assert [c["id"] for c in reordered.json()] == ids

    # delete
    deleted = await auth_client.delete(
        f"/api/boards/{bid}/columns/{new_col['id']}"
    )
    assert deleted.status_code == 204


@pytest.mark.asyncio
async def test_reorder_rejects_mismatched_ids(auth_client: AsyncClient):
    board = (await _create_board(auth_client)).json()
    bid = board["id"]
    resp = await auth_client.post(
        f"/api/boards/{bid}/columns/reorder", json={"column_ids": [99999]}
    )
    assert resp.status_code == 422
    assert resp.json()["code"] == "invalid_reorder"
