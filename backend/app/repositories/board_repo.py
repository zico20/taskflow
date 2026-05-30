from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.board import Board, BoardMember, BoardRole
from app.models.column import Column
from app.models.task import Task


async def get_by_id(db: AsyncSession, board_id: int) -> Board | None:
    return await db.get(Board, board_id)


async def get_with_members(db: AsyncSession, board_id: int) -> Board | None:
    result = await db.execute(
        select(Board)
        .where(Board.id == board_id)
        .options(selectinload(Board.members).selectinload(BoardMember.user))
    )
    return result.scalar_one_or_none()


async def get_user_role(
    db: AsyncSession, *, board_id: int, user_id: int
) -> BoardRole | None:
    result = await db.execute(
        select(BoardMember.role).where(
            BoardMember.board_id == board_id, BoardMember.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def list_for_user(
    db: AsyncSession, user_id: int
) -> list[tuple[Board, BoardRole, int]]:
    """Return (board, role, task_count) for every board the user is a member of."""
    # task count per board via columns join.
    task_count_sq = (
        select(Column.board_id, func.count(Task.id).label("cnt"))
        .join(Task, Task.column_id == Column.id, isouter=True)
        .group_by(Column.board_id)
        .subquery()
    )
    result = await db.execute(
        select(Board, BoardMember.role, func.coalesce(task_count_sq.c.cnt, 0))
        .join(BoardMember, BoardMember.board_id == Board.id)
        .join(task_count_sq, task_count_sq.c.board_id == Board.id, isouter=True)
        .where(BoardMember.user_id == user_id)
        .order_by(Board.updated_at.desc())
    )
    return [(b, r, c) for b, r, c in result.all()]


async def create(
    db: AsyncSession, *, owner_id: int, name: str, description: str | None, color: str
) -> Board:
    board = Board(owner_id=owner_id, name=name, description=description, color=color)
    db.add(board)
    await db.flush()
    # Owner is automatically a member with the owner role.
    db.add(BoardMember(board_id=board.id, user_id=owner_id, role=BoardRole.owner))
    await db.flush()
    await db.refresh(board)
    return board


async def add_member(
    db: AsyncSession, *, board_id: int, user_id: int, role: BoardRole
) -> BoardMember:
    member = BoardMember(board_id=board_id, user_id=user_id, role=role)
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


async def get_member(
    db: AsyncSession, *, board_id: int, user_id: int
) -> BoardMember | None:
    result = await db.execute(
        select(BoardMember)
        .where(BoardMember.board_id == board_id, BoardMember.user_id == user_id)
        .options(selectinload(BoardMember.user))
    )
    return result.scalar_one_or_none()


async def update_member_role(
    db: AsyncSession, *, member: BoardMember, role: BoardRole
) -> BoardMember:
    member.role = role
    db.add(member)
    await db.flush()
    await db.refresh(member, attribute_names=["user"])
    return member


async def remove_member(db: AsyncSession, *, member: BoardMember) -> None:
    await db.delete(member)
    await db.flush()


async def delete(db: AsyncSession, board: Board) -> None:
    await db.delete(board)
    await db.flush()
