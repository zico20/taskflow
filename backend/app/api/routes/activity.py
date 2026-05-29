from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_board_viewer
from app.db.session import get_db
from app.models.board import Board
from app.repositories import activity_repo
from app.schemas.activity import ActivityPublic
from app.services.realtime import human_action

router = APIRouter(prefix="/boards/{board_id}/activity", tags=["activity"])


@router.get("", response_model=list[ActivityPublic])
async def list_activity(
    board: Board = Depends(require_board_viewer),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    entries = await activity_repo.list_recent(db, board_id=board.id, limit=limit)
    result = []
    for e in entries:
        dto = ActivityPublic.model_validate(e).model_dump(mode="json")
        actor_name = e.user.name if e.user else "Someone"
        dto["message"] = human_action(e.action_type, actor_name, e.payload)
        result.append(dto)
    return result
