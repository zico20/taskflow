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


async def _add_viewer(owner: AsyncClient, bid: int) -> None:
    await owner.post(
        f"/api/boards/{bid}/members",
        json={"email": "member@example.com", "role": "viewer"},
    )


@pytest.mark.asyncio
async def test_add_checklist_item(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "Step 1"}
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["content"] == "Step 1"
    assert body["is_done"] is False
    assert body["task_id"] == tid


@pytest.mark.asyncio
async def test_list_checklist_ordered(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    for c in ("a", "b", "c"):
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": c}
        )
    items = (await auth_client.get(f"/api/boards/{bid}/tasks/{tid}/checklist")).json()
    assert [i["content"] for i in items] == ["a", "b", "c"]
    assert items[0]["position"] < items[1]["position"] < items[2]["position"]


@pytest.mark.asyncio
async def test_toggle_checklist_item(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    item = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "x"}
        )
    ).json()
    resp = await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}/checklist/{item['id']}",
        json={"is_done": True},
    )
    assert resp.status_code == 200
    assert resp.json()["is_done"] is True


@pytest.mark.asyncio
async def test_checklist_counts_on_snapshot(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    i1 = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "a"}
        )
    ).json()
    await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "b"}
    )
    await auth_client.patch(
        f"/api/boards/{bid}/tasks/{tid}/checklist/{i1['id']}", json={"is_done": True}
    )
    snap = (await auth_client.get(f"/api/boards/{bid}/tasks")).json()
    task = snap["columns"][0]["tasks"][0]
    assert task["checklist_total"] == 2
    assert task["checklist_done"] == 1


@pytest.mark.asyncio
async def test_reorder_checklist(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    ids = []
    for c in ("a", "b", "c"):
        ids.append(
            (
                await auth_client.post(
                    f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": c}
                )
            ).json()["id"]
        )
    new_order = [ids[2], ids[0], ids[1]]
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist/reorder",
        json={"item_ids": new_order},
    )
    assert resp.status_code == 200
    assert [i["id"] for i in resp.json()] == new_order


@pytest.mark.asyncio
async def test_reorder_mismatch_rejected(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    item = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "a"}
        )
    ).json()
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist/reorder",
        json={"item_ids": [item["id"], 99999]},
    )
    assert resp.status_code == 422
    assert resp.json()["code"] == "validation_error"


@pytest.mark.asyncio
async def test_delete_checklist_item(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    item = (
        await auth_client.post(
            f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "gone"}
        )
    ).json()
    resp = await auth_client.delete(
        f"/api/boards/{bid}/tasks/{tid}/checklist/{item['id']}"
    )
    assert resp.status_code == 204
    items = (await auth_client.get(f"/api/boards/{bid}/tasks/{tid}/checklist")).json()
    assert items == []


@pytest.mark.asyncio
async def test_empty_content_rejected(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "   "}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_over_length_content_rejected(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    resp = await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "x" * 501}
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_viewer_cannot_write_checklist(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, tid = await _board_task(auth_client)
    await _add_viewer(auth_client, bid)
    resp = await second_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "nope"}
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_viewer_can_read_checklist(
    auth_client: AsyncClient, second_client: AsyncClient
):
    bid, tid = await _board_task(auth_client)
    await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "visible"}
    )
    await _add_viewer(auth_client, bid)
    resp = await second_client.get(f"/api/boards/{bid}/tasks/{tid}/checklist")
    assert resp.status_code == 200
    assert resp.json()[0]["content"] == "visible"


@pytest.mark.asyncio
async def test_non_member_404(auth_client: AsyncClient, second_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    # second_client is not a member at all.
    resp = await second_client.get(f"/api/boards/{bid}/tasks/{tid}/checklist")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_cascades_checklist(auth_client: AsyncClient):
    bid, tid = await _board_task(auth_client)
    await auth_client.post(
        f"/api/boards/{bid}/tasks/{tid}/checklist", json={"content": "a"}
    )
    await auth_client.delete(f"/api/boards/{bid}/tasks/{tid}")
    # Task gone → its checklist endpoint 404s.
    resp = await auth_client.get(f"/api/boards/{bid}/tasks/{tid}/checklist")
    assert resp.status_code == 404
