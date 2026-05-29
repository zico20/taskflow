from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_activity_feed_records_and_includes_message(auth_client: AsyncClient):
    board = (
        await auth_client.post("/api/boards", json={"name": "Act"})
    ).json()
    bid = board["id"]
    cols = (await auth_client.get(f"/api/boards/{bid}/columns")).json()
    await auth_client.post(
        f"/api/boards/{bid}/tasks?column_id={cols[0]['id']}",
        json={"title": "Write tests"},
    )

    resp = await auth_client.get(f"/api/boards/{bid}/activity")
    assert resp.status_code == 200
    entries = resp.json()
    # board.created + task.created
    assert len(entries) >= 2
    # The human-readable message must survive response serialization.
    assert all("message" in e and e["message"] for e in entries)
    assert any("Write tests" in e["message"] for e in entries)
    assert any(e["action_type"] == "task.created" for e in entries)
