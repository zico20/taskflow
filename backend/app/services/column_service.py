from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, ValidationAppError
from app.models.column import Column
from app.repositories import column_repo
from app.schemas.column import ColumnCreate, ColumnUpdate

POSITION_STEP = column_repo.POSITION_STEP


async def create_column(
    db: AsyncSession, *, board_id: int, data: ColumnCreate
) -> Column:
    position = await column_repo.next_position(db, board_id)
    column = await column_repo.create(
        db, board_id=board_id, name=data.name, position=position
    )
    return column


async def get_owned_column(
    db: AsyncSession, *, board_id: int, column_id: int
) -> Column:
    column = await column_repo.get_by_id(db, column_id)
    if column is None or column.board_id != board_id:
        raise NotFoundError("Column not found.", code="column_not_found")
    return column


async def update_column(
    db: AsyncSession, *, column: Column, data: ColumnUpdate
) -> Column:
    if data.name is not None:
        column.name = data.name
    db.add(column)
    await db.flush()
    return column


async def delete_column(db: AsyncSession, *, column: Column) -> None:
    await column_repo.delete(db, column)


async def reorder_columns(
    db: AsyncSession, *, board_id: int, column_ids: list[int]
) -> list[Column]:
    columns = await column_repo.list_for_board(db, board_id)
    existing_ids = {c.id for c in columns}
    if set(column_ids) != existing_ids:
        raise ValidationAppError(
            "column_ids must contain exactly the board's columns.",
            code="invalid_reorder",
        )
    by_id = {c.id: c for c in columns}
    for index, cid in enumerate(column_ids):
        by_id[cid].position = (index + 1) * POSITION_STEP
        db.add(by_id[cid])
    await db.flush()
    return [by_id[cid] for cid in column_ids]
