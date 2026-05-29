from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.models.board import Board, BoardRole
from app.models.user import User
from app.repositories import board_repo, column_repo, user_repo
from app.schemas.board import BoardCreate, BoardUpdate


async def create_board(db: AsyncSession, *, owner: User, data: BoardCreate) -> Board:
    board = await board_repo.create(
        db,
        owner_id=owner.id,
        name=data.name,
        description=data.description,
        color=data.color,
    )
    await column_repo.create_defaults(db, board.id)
    await db.flush()
    return board


async def list_boards(db: AsyncSession, *, user: User):
    return await board_repo.list_for_user(db, user.id)


async def get_board_detail(db: AsyncSession, *, board_id: int) -> Board:
    board = await board_repo.get_with_members(db, board_id)
    if board is None:
        raise NotFoundError("Board not found.", code="board_not_found")
    return board


async def update_board(
    db: AsyncSession, *, board: Board, data: BoardUpdate
) -> Board:
    if data.name is not None:
        board.name = data.name
    if data.description is not None:
        board.description = data.description
    if data.color is not None:
        board.color = data.color
    db.add(board)
    await db.flush()
    return board


async def delete_board(db: AsyncSession, *, board: Board) -> None:
    await board_repo.delete(db, board)


async def add_member(
    db: AsyncSession, *, board: Board, email: str, role: BoardRole
) -> tuple[User, BoardRole]:
    if role == BoardRole.owner:
        raise ForbiddenError("Cannot assign the owner role.", code="invalid_role")
    user = await user_repo.get_by_email(db, email)
    if user is None:
        raise NotFoundError("No user with that email.", code="user_not_found")
    existing = await board_repo.get_user_role(
        db, board_id=board.id, user_id=user.id
    )
    if existing is not None:
        raise ConflictError("User is already a member.", code="already_member")
    await board_repo.add_member(db, board_id=board.id, user_id=user.id, role=role)
    await db.flush()
    return user, role
