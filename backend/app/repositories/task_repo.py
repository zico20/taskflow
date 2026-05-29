from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.column import Column
from app.models.label import Label
from app.models.task import Task

POSITION_STEP = 1000


async def get_by_id(db: AsyncSession, task_id: int) -> Task | None:
    result = await db.execute(
        select(Task).where(Task.id == task_id).options(selectinload(Task.labels))
    )
    return result.scalar_one_or_none()


async def list_for_column(db: AsyncSession, column_id: int) -> list[Task]:
    result = await db.execute(
        select(Task)
        .where(Task.column_id == column_id)
        .options(selectinload(Task.labels))
        .order_by(Task.position, Task.id)
    )
    return list(result.scalars().unique().all())


async def get_column_with_board(db: AsyncSession, column_id: int) -> Column | None:
    return await db.get(Column, column_id)


async def next_position(db: AsyncSession, column_id: int) -> int:
    tasks = await list_for_column(db, column_id)
    if not tasks:
        return POSITION_STEP
    return tasks[-1].position + POSITION_STEP


async def get_labels_by_ids(
    db: AsyncSession, *, board_id: int, label_ids: list[int]
) -> list[Label]:
    if not label_ids:
        return []
    result = await db.execute(
        select(Label).where(Label.id.in_(label_ids), Label.board_id == board_id)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    column_id: int,
    title: str,
    description: str | None,
    due_date,
    priority,
    position: int,
    labels: list[Label],
) -> Task:
    task = Task(
        column_id=column_id,
        title=title,
        description=description,
        due_date=due_date,
        priority=priority,
        position=position,
    )
    task.labels = labels
    db.add(task)
    await db.flush()
    await db.refresh(task, attribute_names=["labels"])
    return task


async def delete(db: AsyncSession, task: Task) -> None:
    await db.delete(task)
    await db.flush()
