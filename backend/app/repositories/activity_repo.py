from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.activity import ActivityLog


async def create(
    db: AsyncSession,
    *,
    board_id: int,
    user_id: int | None,
    action_type: str,
    payload: dict[str, Any],
) -> ActivityLog:
    entry = ActivityLog(
        board_id=board_id,
        user_id=user_id,
        action_type=action_type,
        payload=payload,
    )
    db.add(entry)
    await db.flush()
    # Eager-load the user relationship for serialization.
    await db.refresh(entry, attribute_names=["user"])
    return entry


async def list_recent(
    db: AsyncSession, *, board_id: int, limit: int = 20
) -> list[ActivityLog]:
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.board_id == board_id)
        .options(selectinload(ActivityLog.user))
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
