from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_board_editor,
    require_board_viewer,
)
from app.db.session import get_db
from app.models.board import Board
from app.models.user import User
from app.repositories import label_repo
from app.schemas.label import LabelCreate, LabelPublic
from app.services import label_service

router = APIRouter(prefix="/boards/{board_id}/labels", tags=["labels"])


@router.get("", response_model=list[LabelPublic])
async def list_labels(
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
) -> list[LabelPublic]:
    labels = await label_repo.list_for_board(db, board.id)
    return [LabelPublic.model_validate(label) for label in labels]


@router.post("", response_model=LabelPublic, status_code=status.HTTP_201_CREATED)
async def create_label(
    payload: LabelCreate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> LabelPublic:
    label = await label_service.create_label(
        db, board=board, actor=user, data=payload
    )
    return LabelPublic.model_validate(label)


@router.delete(
    "/{label_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_label(
    label_id: int,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    await label_service.delete_label(
        db, board=board, actor=user, label_id=label_id
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
