"""WebSocket endpoint for real-time board collaboration.

Clients connect to /ws/boards/{board_id}. Authentication uses the same JWT as
the REST API, read from the httpOnly cookie or a `?token=` query param (browsers
can't set headers on WebSocket handshakes, so the query param is the fallback).

Inbound messages from the client are limited to lightweight signals (e.g. a
"ping" heartbeat). All authoritative state changes go through the REST API, which
then broadcasts the resulting event to every socket on the board.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
from app.repositories import board_repo, user_repo
from app.websockets.manager import manager

router = APIRouter()


async def _authenticate_ws(websocket: WebSocket, token: str | None):
    """Return (user, role) if the socket may join the board, else None."""
    raw = token or websocket.cookies.get(settings.COOKIE_NAME)
    if not raw:
        return None
    payload = decode_token(raw, expected_type="access")
    if payload is None or "sub" not in payload:
        return None
    # Tests can inject a session factory via app.state to share the test DB.
    session_factory = getattr(
        websocket.app.state, "session_factory", None
    ) or AsyncSessionLocal
    async with session_factory() as db:
        user = await user_repo.get_by_id(db, int(payload["sub"]))
        if user is None:
            return None
        board_id = websocket.path_params.get("board_id")
        role = await board_repo.get_user_role(
            db, board_id=int(board_id), user_id=user.id
        )
        if role is None:
            return None
        return user, role


@router.websocket("/ws/boards/{board_id}")
async def board_socket(
    websocket: WebSocket,
    board_id: int,
    token: str | None = Query(default=None),
) -> None:
    auth = await _authenticate_ws(websocket, token)
    if auth is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user, _role = auth
    conn_id = uuid.uuid4().hex
    user_summary = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar_url": user.avatar_url,
    }

    await manager.connect(board_id, conn_id, websocket, user_summary)
    try:
        while True:
            message = await websocket.receive_json()
            msg_type = message.get("type")
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
            # Other inbound types are ignored by design; REST is the source of truth.
    except WebSocketDisconnect:
        pass
    except Exception:
        # Swallow protocol errors; we'll clean up in finally.
        pass
    finally:
        await manager.disconnect(board_id, conn_id)
