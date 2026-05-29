from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.task import Task
from app.repositories import column_repo, task_repo
from app.schemas.task import TaskCreate, TaskMove, TaskUpdate

POSITION_STEP = task_repo.POSITION_STEP


async def _validate_column_on_board(
    db: AsyncSession, *, board_id: int, column_id: int
):
    column = await column_repo.get_by_id(db, column_id)
    if column is None or column.board_id != board_id:
        raise NotFoundError("Column not found.", code="column_not_found")
    return column


async def create_task(
    db: AsyncSession, *, board_id: int, column_id: int, data: TaskCreate
) -> Task:
    await _validate_column_on_board(db, board_id=board_id, column_id=column_id)
    labels = await task_repo.get_labels_by_ids(
        db, board_id=board_id, label_ids=data.label_ids
    )
    position = await task_repo.next_position(db, column_id)
    task = await task_repo.create(
        db,
        column_id=column_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        priority=data.priority,
        position=position,
        labels=labels,
    )
    return task


async def get_owned_task(db: AsyncSession, *, board_id: int, task_id: int) -> Task:
    task = await task_repo.get_by_id(db, task_id)
    if task is None:
        raise NotFoundError("Task not found.", code="task_not_found")
    column = await column_repo.get_by_id(db, task.column_id)
    if column is None or column.board_id != board_id:
        raise NotFoundError("Task not found.", code="task_not_found")
    return task


async def update_task(
    db: AsyncSession, *, board_id: int, task: Task, data: TaskUpdate
) -> Task:
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.due_date is not None:
        task.due_date = data.due_date
    if data.priority is not None:
        task.priority = data.priority
    if data.label_ids is not None:
        labels = await task_repo.get_labels_by_ids(
            db, board_id=board_id, label_ids=data.label_ids
        )
        task.labels = labels
    db.add(task)
    await db.flush()
    await db.refresh(task, attribute_names=["labels"])
    return task


async def delete_task(db: AsyncSession, *, task: Task) -> None:
    await task_repo.delete(db, task)


async def move_task(
    db: AsyncSession, *, board_id: int, task: Task, move: TaskMove
) -> Task:
    """Move a task to `move.column_id` at the 0-based index `move.position`.

    Positions are stored as gapped integers. On every move we recompute the
    target column's positions from the desired ordering so the result is always
    consistent, regardless of gaps. This is O(n) in the target column size,
    which is fine for kanban-sized columns and avoids fragile gap arithmetic.
    """
    target_column = await _validate_column_on_board(
        db, board_id=board_id, column_id=move.column_id
    )
    source_column_id = task.column_id

    # Build the destination ordering excluding the moved task.
    dest_tasks = [
        t
        for t in await task_repo.list_for_column(db, target_column.id)
        if t.id != task.id
    ]
    index = max(0, min(move.position, len(dest_tasks)))
    dest_tasks.insert(index, task)

    # Reassign the moved task's column, then renumber the destination column.
    task.column_id = target_column.id
    for i, t in enumerate(dest_tasks):
        t.position = (i + 1) * POSITION_STEP
        db.add(t)

    # If it changed columns, compact the source column too (keeps gaps sane).
    if source_column_id != target_column.id:
        src_tasks = await task_repo.list_for_column(db, source_column_id)
        for i, t in enumerate(src_tasks):
            t.position = (i + 1) * POSITION_STEP
            db.add(t)

    await db.flush()
    await db.refresh(task, attribute_names=["labels"])
    return task
