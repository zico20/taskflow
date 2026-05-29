from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.label import Label


async def get_by_id(db: AsyncSession, label_id: int) -> Label | None:
    return await db.get(Label, label_id)


async def list_for_board(db: AsyncSession, board_id: int) -> list[Label]:
    result = await db.execute(
        select(Label).where(Label.board_id == board_id).order_by(Label.name)
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession, *, board_id: int, name: str, color: str
) -> Label:
    label = Label(board_id=board_id, name=name, color=color)
    db.add(label)
    await db.flush()
    await db.refresh(label)
    return label


async def delete(db: AsyncSession, label: Label) -> None:
    await db.delete(label)
    await db.flush()
