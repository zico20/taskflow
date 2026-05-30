from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checklist_item import ChecklistItem

POSITION_STEP = 1000  # gapped positions, like tasks/columns


async def list_for_task(db: AsyncSession, task_id: int) -> list[ChecklistItem]:
    result = await db.execute(
        select(ChecklistItem)
        .where(ChecklistItem.task_id == task_id)
        .order_by(ChecklistItem.position, ChecklistItem.id)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, item_id: int) -> ChecklistItem | None:
    return await db.get(ChecklistItem, item_id)


async def next_position(db: AsyncSession, task_id: int) -> int:
    items = await list_for_task(db, task_id)
    if not items:
        return POSITION_STEP
    return items[-1].position + POSITION_STEP


async def create(
    db: AsyncSession, *, task_id: int, content: str, position: int
) -> ChecklistItem:
    item = ChecklistItem(task_id=task_id, content=content, position=position)
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def update(
    db: AsyncSession,
    item: ChecklistItem,
    *,
    content: str | None = None,
    is_done: bool | None = None,
) -> ChecklistItem:
    if content is not None:
        item.content = content
    if is_done is not None:
        item.is_done = is_done
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def set_order(
    db: AsyncSession, items: list[ChecklistItem], ordered_ids: list[int]
) -> list[ChecklistItem]:
    """Renumber the given items to match `ordered_ids` (gapped positions)."""
    by_id = {item.id: item for item in items}
    for index, item_id in enumerate(ordered_ids):
        item = by_id[item_id]
        item.position = (index + 1) * POSITION_STEP
        db.add(item)
    await db.flush()
    return [by_id[i] for i in ordered_ids]


async def delete(db: AsyncSession, item: ChecklistItem) -> None:
    await db.delete(item)
    await db.flush()
