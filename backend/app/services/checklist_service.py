"""Business logic for task checklist items (subtasks).

Mirrors the labels/tasks layering: routes stay thin, this module owns validation
and the real-time broadcast, and all DB access goes through checklist_repo.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationAppError
from app.models.checklist_item import ChecklistItem
from app.models.user import User
from app.repositories import checklist_repo
from app.schemas.checklist import (
    ChecklistItemCreate,
    ChecklistItemPublic,
    ChecklistItemUpdate,
)
from app.services import task_service
from app.services.realtime import broadcast_only, record_and_broadcast


async def list_items(
    db: AsyncSession, *, board_id: int, task_id: int
) -> list[ChecklistItem]:
    # Validates the task belongs to the board (404 otherwise).
    await task_service.get_owned_task(db, board_id=board_id, task_id=task_id)
    return await checklist_repo.list_for_task(db, task_id)


async def _get_owned_item(
    db: AsyncSession, *, board_id: int, task_id: int, item_id: int
) -> ChecklistItem:
    await task_service.get_owned_task(db, board_id=board_id, task_id=task_id)
    item = await checklist_repo.get_by_id(db, item_id)
    if item is None or item.task_id != task_id:
        raise NotFoundError("Checklist item not found.", code="checklist_item_not_found")
    return item


async def create_item(
    db: AsyncSession,
    *,
    board_id: int,
    task_id: int,
    actor: User,
    data: ChecklistItemCreate,
) -> ChecklistItem:
    await task_service.get_owned_task(db, board_id=board_id, task_id=task_id)
    position = await checklist_repo.next_position(db, task_id)
    item = await checklist_repo.create(
        db, task_id=task_id, content=data.content, position=position
    )
    dto = ChecklistItemPublic.model_validate(item)
    await record_and_broadcast(
        db,
        board_id=board_id,
        actor=actor,
        action_type="checklist.item_added",
        payload={"title": data.content},
        ws_event="checklist.created",
        ws_data=dto.model_dump(mode="json"),
    )
    return item


async def update_item(
    db: AsyncSession,
    *,
    board_id: int,
    task_id: int,
    item_id: int,
    actor: User,
    data: ChecklistItemUpdate,
) -> ChecklistItem:
    item = await _get_owned_item(
        db, board_id=board_id, task_id=task_id, item_id=item_id
    )
    updated = await checklist_repo.update(
        db, item, content=data.content, is_done=data.is_done
    )
    dto = ChecklistItemPublic.model_validate(updated)
    # Toggles/edits are frequent; broadcast for live sync but don't log every one
    # to the activity feed (only meaningful add/remove are logged).
    await broadcast_only(
        db,
        board_id=board_id,
        actor=actor,
        ws_event="checklist.updated",
        ws_data=dto.model_dump(mode="json"),
    )
    return updated


async def reorder_items(
    db: AsyncSession,
    *,
    board_id: int,
    task_id: int,
    actor: User,
    item_ids: list[int],
) -> list[ChecklistItem]:
    await task_service.get_owned_task(db, board_id=board_id, task_id=task_id)
    items = await checklist_repo.list_for_task(db, task_id)
    current_ids = {item.id for item in items}
    if set(item_ids) != current_ids or len(item_ids) != len(items):
        raise ValidationAppError(
            "item_ids must exactly match the task's checklist items.",
            code="validation_error",
        )
    reordered = await checklist_repo.set_order(db, items, item_ids)
    await broadcast_only(
        db,
        board_id=board_id,
        actor=actor,
        ws_event="checklist.reordered",
        ws_data={"task_id": task_id, "item_ids": item_ids},
    )
    return reordered


async def delete_item(
    db: AsyncSession,
    *,
    board_id: int,
    task_id: int,
    item_id: int,
    actor: User,
) -> None:
    item = await _get_owned_item(
        db, board_id=board_id, task_id=task_id, item_id=item_id
    )
    content = item.content
    await checklist_repo.delete(db, item)
    await record_and_broadcast(
        db,
        board_id=board_id,
        actor=actor,
        action_type="checklist.item_removed",
        payload={"title": content},
        ws_event="checklist.deleted",
        ws_data={"task_id": task_id, "id": item_id},
    )
