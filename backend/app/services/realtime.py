"""Helpers that record an activity entry and broadcast a real-time event.

Services call `record_and_broadcast` after a mutation so that (a) it lands in the
activity log and (b) connected WebSocket clients update instantly. Broadcasting is
best-effort and never blocks the request's success.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories import activity_repo
from app.schemas.activity import ActivityPublic
from app.websockets.manager import manager


def human_action(action_type: str, user_name: str, payload: dict[str, Any]) -> str:
    """Build a human-readable activity sentence (used by the frontend feed too)."""
    target = payload.get("title") or payload.get("name") or ""
    verbs = {
        "task.created": f"created task '{target}'",
        "task.updated": f"updated task '{target}'",
        "task.deleted": f"deleted task '{target}'",
        "task.moved": f"moved '{target}' to {payload.get('to_column', '')}",
        "column.created": f"added column '{target}'",
        "column.renamed": f"renamed a column to '{target}'",
        "column.deleted": f"deleted column '{target}'",
        "column.reordered": "reordered columns",
        "board.created": f"created board '{target}'",
        "board.updated": f"updated board '{target}'",
        "member.added": f"added {payload.get('member_name', 'a member')}",
    }
    return f"{user_name} {verbs.get(action_type, action_type)}"


async def record_and_broadcast(
    db: AsyncSession,
    *,
    board_id: int,
    actor: User,
    action_type: str,
    payload: dict[str, Any],
    ws_event: str | None = None,
    ws_data: dict[str, Any] | None = None,
    exclude_conn: str | None = None,
) -> None:
    entry = await activity_repo.create(
        db,
        board_id=board_id,
        user_id=actor.id,
        action_type=action_type,
        payload=payload,
    )
    # Commit so other requests/sockets see the change before we broadcast.
    await db.commit()

    activity_dto = ActivityPublic.model_validate(entry).model_dump(mode="json")
    activity_dto["message"] = human_action(action_type, actor.name, payload)

    # Always broadcast the activity entry so feeds stay in sync.
    await manager.broadcast(
        board_id, {"type": "activity", "data": activity_dto}, exclude=exclude_conn
    )
    # Optionally broadcast a domain event (e.g. task.moved) for live board updates.
    if ws_event is not None:
        await manager.broadcast(
            board_id,
            {"type": ws_event, "data": ws_data or {}, "actor_id": actor.id},
            exclude=exclude_conn,
        )
