from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_board_editor, require_board_viewer
from app.db.session import get_db
from app.models.board import Board
from app.models.user import User
from app.schemas.checklist import (
    ChecklistItemCreate,
    ChecklistItemPublic,
    ChecklistItemUpdate,
    ChecklistReorder,
)
from app.services import checklist_service

router = APIRouter(
    prefix="/boards/{board_id}/tasks/{task_id}/checklist", tags=["checklist"]
)


@router.get("", response_model=list[ChecklistItemPublic])
async def list_checklist(
    task_id: int,
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
) -> list[ChecklistItemPublic]:
    items = await checklist_service.list_items(
        db, board_id=board.id, task_id=task_id
    )
    return [ChecklistItemPublic.model_validate(i) for i in items]


@router.post("", response_model=ChecklistItemPublic, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    task_id: int,
    payload: ChecklistItemCreate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChecklistItemPublic:
    item = await checklist_service.create_item(
        db, board_id=board.id, task_id=task_id, actor=user, data=payload
    )
    return ChecklistItemPublic.model_validate(item)


@router.patch("/{item_id}", response_model=ChecklistItemPublic)
async def update_checklist_item(
    task_id: int,
    item_id: int,
    payload: ChecklistItemUpdate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChecklistItemPublic:
    item = await checklist_service.update_item(
        db,
        board_id=board.id,
        task_id=task_id,
        item_id=item_id,
        actor=user,
        data=payload,
    )
    return ChecklistItemPublic.model_validate(item)


@router.post("/reorder", response_model=list[ChecklistItemPublic])
async def reorder_checklist(
    task_id: int,
    payload: ChecklistReorder,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[ChecklistItemPublic]:
    items = await checklist_service.reorder_items(
        db,
        board_id=board.id,
        task_id=task_id,
        actor=user,
        item_ids=payload.item_ids,
    )
    return [ChecklistItemPublic.model_validate(i) for i in items]


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_checklist_item(
    task_id: int,
    item_id: int,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    await checklist_service.delete_item(
        db, board_id=board.id, task_id=task_id, item_id=item_id, actor=user
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
