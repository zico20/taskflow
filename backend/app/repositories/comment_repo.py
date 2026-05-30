from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.comment import Comment


async def list_for_task(db: AsyncSession, task_id: int) -> list[Comment]:
    result = await db.execute(
        select(Comment)
        .where(Comment.task_id == task_id)
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at, Comment.id)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, comment_id: int) -> Comment | None:
    result = await db.execute(
        select(Comment)
        .where(Comment.id == comment_id)
        .options(selectinload(Comment.author))
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession, *, task_id: int, user_id: int, content: str
) -> Comment:
    comment = Comment(task_id=task_id, user_id=user_id, content=content)
    db.add(comment)
    await db.flush()
    await db.refresh(comment, attribute_names=["author"])
    return comment


async def delete(db: AsyncSession, comment: Comment) -> None:
    await db.delete(comment)
    await db.flush()
