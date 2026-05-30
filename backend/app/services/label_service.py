"""Business logic for board labels.

Hosts the rules that don't belong in the route: case-insensitive name uniqueness
and the real-time broadcast on create/delete. Keeps the route → service →
repository layering consistent with tasks/boards.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.models.board import Board
from app.models.label import Label
from app.models.user import User
from app.repositories import label_repo
from app.schemas.label import LabelCreate, LabelPublic
from app.services.realtime import record_and_broadcast


async def create_label(
    db: AsyncSession, *, board: Board, actor: User, data: LabelCreate
) -> Label:
    """Create a label, rejecting a case-insensitive duplicate name on the board."""
    name = data.name.strip()
    existing = await label_repo.get_by_name_ci(db, board_id=board.id, name=name)
    if existing is not None:
        raise ConflictError(
            "A label with that name already exists.", code="label_name_taken"
        )
    label = await label_repo.create(
        db, board_id=board.id, name=name, color=data.color
    )
    dto = LabelPublic.model_validate(label)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=actor,
        action_type="label.created",
        payload={"name": label.name},
        ws_event="label.created",
        ws_data=dto.model_dump(mode="json"),
    )
    return label


async def delete_label(
    db: AsyncSession, *, board: Board, actor: User, label_id: int
) -> None:
    """Delete a board label; FK cascade clears its task assignments (chips)."""
    label = await label_repo.get_by_id(db, label_id)
    if label is None or label.board_id != board.id:
        raise NotFoundError("Label not found.", code="label_not_found")
    name = label.name
    await label_repo.delete(db, label)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=actor,
        action_type="label.deleted",
        payload={"name": name},
        ws_event="label.deleted",
        ws_data={"id": label_id},
    )
