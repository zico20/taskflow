"""WebSocket tests using Starlette's TestClient (which supports WS)."""
from __future__ import annotations

import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.core.security import create_access_token, hash_password
from app.models.board import Board, BoardMember, BoardRole
from app.models.user import User


@pytest.mark.asyncio
async def test_ws_rejects_without_token(app):
    with TestClient(app) as tc:
        # No token -> server should close with policy violation before accept.
        with pytest.raises(WebSocketDisconnect):
            with tc.websocket_connect("/ws/boards/1"):
                pass


@pytest.mark.asyncio
async def test_ws_connect_presence_and_ping(app, db):
    # Seed a user + board + membership directly.
    user = User(
        email="ws@example.com", password_hash=hash_password("password123"), name="WS"
    )
    db.add(user)
    await db.flush()
    board = Board(owner_id=user.id, name="WS Board", color="#fff")
    db.add(board)
    await db.flush()
    db.add(BoardMember(board_id=board.id, user_id=user.id, role=BoardRole.owner))
    await db.commit()

    token = create_access_token(user.id)

    with TestClient(app) as tc:
        with tc.websocket_connect(
            f"/ws/boards/{board.id}?token={token}"
        ) as ws:
            # On connect the server broadcasts presence.
            presence = ws.receive_json()
            assert presence["type"] == "presence"
            viewers = presence["data"]["viewers"]
            assert any(v["id"] == user.id for v in viewers)

            # Heartbeat round-trip.
            ws.send_json({"type": "ping"})
            pong = ws.receive_json()
            assert pong["type"] == "pong"


@pytest.mark.asyncio
async def test_ws_rejects_non_member(app, db):
    owner = User(
        email="o2@example.com", password_hash=hash_password("password123"), name="O"
    )
    outsider = User(
        email="out@example.com", password_hash=hash_password("password123"), name="X"
    )
    db.add_all([owner, outsider])
    await db.flush()
    board = Board(owner_id=owner.id, name="Closed", color="#fff")
    db.add(board)
    await db.flush()
    db.add(BoardMember(board_id=board.id, user_id=owner.id, role=BoardRole.owner))
    await db.commit()

    token = create_access_token(outsider.id)
    with TestClient(app) as tc:
        with pytest.raises(WebSocketDisconnect):
            with tc.websocket_connect(f"/ws/boards/{board.id}?token={token}"):
                pass
