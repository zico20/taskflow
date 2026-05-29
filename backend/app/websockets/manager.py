"""In-memory WebSocket connection manager with per-board broadcasting and presence.

v1 uses a single-process in-memory registry. For horizontal scaling, swap the
broadcast/presence internals for Redis Pub/Sub so events fan out across workers.

TODO(scaling): Replace in-memory broadcast with Redis Pub/Sub. Publish events to
a `board:{id}` channel and have each worker subscribe and relay to its local
sockets. Presence would move to a Redis hash with TTL heartbeats.
See README "Real-Time Architecture" for the design. (issue: TBD)
"""
from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class Presence:
    """Tracks which users are viewing a board (by connection)."""

    def __init__(self) -> None:
        # board_id -> { connection_id -> user_summary }
        self._viewers: dict[int, dict[str, dict[str, Any]]] = defaultdict(dict)

    def add(self, board_id: int, conn_id: str, user: dict[str, Any]) -> None:
        self._viewers[board_id][conn_id] = user

    def remove(self, board_id: int, conn_id: str) -> None:
        self._viewers.get(board_id, {}).pop(conn_id, None)
        if board_id in self._viewers and not self._viewers[board_id]:
            del self._viewers[board_id]

    def list(self, board_id: int) -> list[dict[str, Any]]:
        # Deduplicate by user id (same user may have multiple tabs open).
        seen: dict[int, dict[str, Any]] = {}
        for user in self._viewers.get(board_id, {}).values():
            seen[user["id"]] = user
        return list(seen.values())


class ConnectionManager:
    def __init__(self) -> None:
        # board_id -> { connection_id -> WebSocket }
        self._connections: dict[int, dict[str, WebSocket]] = defaultdict(dict)
        self._presence = Presence()
        self._lock = asyncio.Lock()

    async def connect(
        self, board_id: int, conn_id: str, websocket: WebSocket, user: dict[str, Any]
    ) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[board_id][conn_id] = websocket
            self._presence.add(board_id, conn_id, user)
        # Tell everyone (including the new client) who's here now.
        await self.broadcast_presence(board_id)

    async def disconnect(self, board_id: int, conn_id: str) -> None:
        async with self._lock:
            self._connections.get(board_id, {}).pop(conn_id, None)
            self._presence.remove(board_id, conn_id)
            if board_id in self._connections and not self._connections[board_id]:
                del self._connections[board_id]
        await self.broadcast_presence(board_id)

    async def broadcast(
        self, board_id: int, message: dict[str, Any], *, exclude: str | None = None
    ) -> None:
        """Send a JSON message to all sockets on a board, optionally excluding one."""
        # Copy targets under lock; send outside the lock to avoid head-of-line stalls.
        async with self._lock:
            targets = [
                (cid, ws)
                for cid, ws in self._connections.get(board_id, {}).items()
                if cid != exclude
            ]
        dead: list[str] = []
        for cid, ws in targets:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(cid)
        for cid in dead:
            await self.disconnect(board_id, cid)

    async def broadcast_presence(self, board_id: int) -> None:
        viewers = self._presence.list(board_id)
        async with self._lock:
            targets = list(self._connections.get(board_id, {}).items())
        for _cid, ws in targets:
            try:
                await ws.send_json({"type": "presence", "data": {"viewers": viewers}})
            except Exception:
                pass

    def viewers(self, board_id: int) -> list[dict[str, Any]]:
        return self._presence.list(board_id)


# Singleton manager shared across the app.
manager = ConnectionManager()
