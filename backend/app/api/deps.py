"""FastAPI dependencies: current user resolution and board permission checks."""
from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.board import Board, BoardRole
from app.models.user import User
from app.repositories import board_repo, user_repo


def _extract_token(request: Request) -> str | None:
    """Read the JWT from the httpOnly cookie, falling back to Authorization header."""
    token = request.cookies.get(settings.COOKIE_NAME)
    if token:
        return token
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:]
    return None


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    token = _extract_token(request)
    if not token:
        raise UnauthorizedError("Not authenticated.", code="not_authenticated")
    payload = decode_token(token, expected_type="access")
    if payload is None or "sub" not in payload:
        raise UnauthorizedError("Invalid or expired token.", code="invalid_token")
    user = await user_repo.get_by_id(db, int(payload["sub"]))
    if user is None:
        raise UnauthorizedError("User no longer exists.", code="user_not_found")
    return user


# --- Board access helpers ---
_ROLE_RANK = {BoardRole.viewer: 0, BoardRole.editor: 1, BoardRole.owner: 2}


async def _resolve_board_and_role(
    db: AsyncSession, board_id: int, user: User
) -> tuple[Board, BoardRole]:
    board = await board_repo.get_by_id(db, board_id)
    if board is None:
        raise NotFoundError("Board not found.", code="board_not_found")
    role = await board_repo.get_user_role(db, board_id=board_id, user_id=user.id)
    if role is None:
        # Don't leak existence to non-members.
        raise NotFoundError("Board not found.", code="board_not_found")
    return board, role


class BoardAccess:
    """Dependency factory enforcing a minimum role on a board path param."""

    def __init__(self, min_role: BoardRole = BoardRole.viewer) -> None:
        self.min_role = min_role

    async def __call__(
        self,
        board_id: int,
        db: AsyncSession = Depends(get_db),
        user: User = Depends(get_current_user),
    ) -> Board:
        board, role = await _resolve_board_and_role(db, board_id, user)
        if _ROLE_RANK[role] < _ROLE_RANK[self.min_role]:
            raise ForbiddenError(
                f"This action requires '{self.min_role.value}' access.",
                code="insufficient_role",
            )
        # Stash the role on the request-scoped board for downstream use.
        board._current_user_role = role  # type: ignore[attr-defined]
        return board


require_board_viewer = BoardAccess(BoardRole.viewer)
require_board_editor = BoardAccess(BoardRole.editor)
require_board_owner = BoardAccess(BoardRole.owner)
