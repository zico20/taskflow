from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_board_editor, require_board_viewer
from app.db.session import get_db
from app.models.board import Board
from app.models.user import User
from app.schemas.column import (
    ColumnCreate,
    ColumnPublic,
    ColumnReorder,
    ColumnUpdate,
)
from app.services import column_service
from app.services.realtime import record_and_broadcast

router = APIRouter(prefix="/boards/{board_id}/columns", tags=["columns"])


@router.get("", response_model=list[ColumnPublic])
async def list_columns(
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
) -> list[ColumnPublic]:
    from app.repositories import column_repo

    cols = await column_repo.list_for_board(db, board.id)
    return [ColumnPublic.model_validate(c) for c in cols]


@router.post("", response_model=ColumnPublic, status_code=status.HTTP_201_CREATED)
async def create_column(
    payload: ColumnCreate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ColumnPublic:
    column = await column_service.create_column(db, board_id=board.id, data=payload)
    dto = ColumnPublic.model_validate(column)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="column.created",
        payload={"name": column.name},
        ws_event="column.created",
        ws_data=dto.model_dump(mode="json"),
    )
    return dto


@router.patch("/{column_id}", response_model=ColumnPublic)
async def update_column(
    column_id: int,
    payload: ColumnUpdate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ColumnPublic:
    column = await column_service.get_owned_column(
        db, board_id=board.id, column_id=column_id
    )
    updated = await column_service.update_column(db, column=column, data=payload)
    dto = ColumnPublic.model_validate(updated)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="column.renamed",
        payload={"name": updated.name},
        ws_event="column.updated",
        ws_data=dto.model_dump(mode="json"),
    )
    return dto


@router.delete(
    "/{column_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_column(
    column_id: int,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    column = await column_service.get_owned_column(
        db, board_id=board.id, column_id=column_id
    )
    name = column.name
    await column_service.delete_column(db, column=column)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="column.deleted",
        payload={"name": name},
        ws_event="column.deleted",
        ws_data={"id": column_id},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reorder", response_model=list[ColumnPublic])
async def reorder_columns(
    payload: ColumnReorder,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ColumnPublic]:
    cols = await column_service.reorder_columns(
        db, board_id=board.id, column_ids=payload.column_ids
    )
    dtos = [ColumnPublic.model_validate(c) for c in cols]
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="column.reordered",
        payload={},
        ws_event="column.reordered",
        ws_data={"column_ids": payload.column_ids},
    )
    return dtos
