from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_board_editor, require_board_viewer
from app.db.session import get_db
from app.models.board import Board
from app.models.user import User
from app.schemas.task import (
    BoardSnapshot,
    ColumnWithTasks,
    TaskCreate,
    TaskMove,
    TaskPublic,
    TaskUpdate,
)
from app.services import task_service
from app.services.realtime import record_and_broadcast

router = APIRouter(prefix="/boards/{board_id}/tasks", tags=["tasks"])


@router.get("", response_model=BoardSnapshot)
async def board_snapshot(
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
) -> BoardSnapshot:
    """Full board state: columns (ordered) each with their ordered tasks."""
    from app.repositories import column_repo

    columns = await column_repo.list_for_board_with_tasks(db, board.id)
    return BoardSnapshot(
        board_id=board.id,
        columns=[ColumnWithTasks.model_validate(c) for c in columns],
    )


@router.post("", response_model=TaskPublic, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    column_id: int = Query(..., description="Target column id"),
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskPublic:
    task = await task_service.create_task(
        db, board_id=board.id, column_id=column_id, data=payload
    )
    dto = TaskPublic.model_validate(task)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="task.created",
        payload={"title": task.title},
        ws_event="task.created",
        ws_data=dto.model_dump(mode="json"),
    )
    return dto


@router.get("/{task_id}", response_model=TaskPublic)
async def get_task(
    task_id: int,
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
) -> TaskPublic:
    task = await task_service.get_owned_task(db, board_id=board.id, task_id=task_id)
    return TaskPublic.model_validate(task)


@router.patch("/{task_id}", response_model=TaskPublic)
async def update_task(
    task_id: int,
    payload: TaskUpdate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskPublic:
    task = await task_service.get_owned_task(db, board_id=board.id, task_id=task_id)
    updated = await task_service.update_task(
        db, board_id=board.id, task=task, data=payload
    )
    # Serialize BEFORE record_and_broadcast commits — a commit would leave the
    # server-side onupdate(updated_at) value unloaded, forcing a lazy refresh
    # during serialization (which fails outside the async greenlet context).
    dto = TaskPublic.model_validate(updated)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="task.updated",
        payload={"title": updated.title},
        ws_event="task.updated",
        ws_data=dto.model_dump(mode="json"),
    )
    return dto


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_task(
    task_id: int,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    task = await task_service.get_owned_task(db, board_id=board.id, task_id=task_id)
    title = task.title
    await task_service.delete_task(db, task=task)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="task.deleted",
        payload={"title": title},
        ws_event="task.deleted",
        ws_data={"id": task_id},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{task_id}/move", response_model=TaskPublic)
async def move_task(
    task_id: int,
    payload: TaskMove,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskPublic:
    task = await task_service.get_owned_task(db, board_id=board.id, task_id=task_id)
    from app.repositories import column_repo

    target_col = await column_repo.get_by_id(db, payload.column_id)
    updated = await task_service.move_task(
        db, board_id=board.id, task=task, move=payload
    )
    # Serialize before the commit inside record_and_broadcast (see note in update).
    dto = TaskPublic.model_validate(updated)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="task.moved",
        payload={
            "title": updated.title,
            "to_column": target_col.name if target_col else "",
        },
        ws_event="task.moved",
        ws_data={
            "id": updated.id,
            "column_id": updated.column_id,
            "position": updated.position,
        },
    )
    return dto
