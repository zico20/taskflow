"""Business logic for task comments.

Routes stay thin; this module owns authorization (author-or-owner delete) and the
real-time broadcast. All DB access goes through comment_repo.
"""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError
from app.models.board import BoardRole
from app.models.comment import Comment
from app.models.user import User
from app.repositories import comment_repo
from app.schemas.comment import CommentCreate, CommentPublic
from app.services import task_service
from app.services.realtime import record_and_broadcast


async def list_comments(
    db: AsyncSession, *, board_id: int, task_id: int
) -> list[Comment]:
    await task_service.get_owned_task(db, board_id=board_id, task_id=task_id)
    return await comment_repo.list_for_task(db, task_id)


async def create_comment(
    db: AsyncSession,
    *,
    board_id: int,
    task_id: int,
    actor: User,
    data: CommentCreate,
) -> Comment:
    await task_service.get_owned_task(db, board_id=board_id, task_id=task_id)
    comment = await comment_repo.create(
        db, task_id=task_id, user_id=actor.id, content=data.content
    )
    dto = CommentPublic.model_validate(comment)
    await record_and_broadcast(
        db,
        board_id=board_id,
        actor=actor,
        action_type="comment.added",
        payload={"name": actor.name},
        ws_event="comment.created",
        ws_data=dto.model_dump(mode="json"),
    )
    return comment


async def delete_comment(
    db: AsyncSession,
    *,
    board_id: int,
    task_id: int,
    comment_id: int,
    actor: User,
    actor_role: BoardRole,
) -> None:
    await task_service.get_owned_task(db, board_id=board_id, task_id=task_id)
    comment = await comment_repo.get_by_id(db, comment_id)
    if comment is None or comment.task_id != task_id:
        raise NotFoundError("Comment not found.", code="comment_not_found")
    # A comment may be deleted by its author or by the board owner (moderation).
    if comment.user_id != actor.id and actor_role != BoardRole.owner:
        raise ForbiddenError(
            "You can only delete your own comment.", code="forbidden"
        )
    await comment_repo.delete(db, comment)
    await record_and_broadcast(
        db,
        board_id=board_id,
        actor=actor,
        action_type="comment.removed",
        payload={"name": actor.name},
        ws_event="comment.deleted",
        ws_data={"task_id": task_id, "id": comment_id},
    )
