from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_board_editor, require_board_viewer
from app.db.session import get_db
from app.models.board import Board, BoardRole
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentPublic
from app.services import comment_service

router = APIRouter(
    prefix="/boards/{board_id}/tasks/{task_id}/comments", tags=["comments"]
)


@router.get("", response_model=list[CommentPublic])
async def list_comments(
    task_id: int,
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
) -> list[CommentPublic]:
    comments = await comment_service.list_comments(
        db, board_id=board.id, task_id=task_id
    )
    return [CommentPublic.model_validate(c) for c in comments]


@router.post("", response_model=CommentPublic, status_code=status.HTTP_201_CREATED)
async def create_comment(
    task_id: int,
    payload: CommentCreate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CommentPublic:
    comment = await comment_service.create_comment(
        db, board_id=board.id, task_id=task_id, actor=user, data=payload
    )
    return CommentPublic.model_validate(comment)


@router.delete(
    "/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_comment(
    task_id: int,
    comment_id: int,
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    # Any board member may attempt; the service enforces author-or-owner.
    actor_role: BoardRole = getattr(board, "_current_user_role", BoardRole.viewer)
    await comment_service.delete_comment(
        db,
        board_id=board.id,
        task_id=task_id,
        comment_id=comment_id,
        actor=user,
        actor_role=actor_role,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
