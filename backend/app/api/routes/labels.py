from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_board_editor, require_board_viewer
from app.core.errors import NotFoundError
from app.db.session import get_db
from app.models.board import Board
from app.repositories import label_repo
from app.schemas.label import LabelCreate, LabelPublic

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
) -> LabelPublic:
    label = await label_repo.create(
        db, board_id=board.id, name=payload.name, color=payload.color
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
) -> Response:
    label = await label_repo.get_by_id(db, label_id)
    if label is None or label.board_id != board.id:
        raise NotFoundError("Label not found.", code="label_not_found")
    await label_repo.delete(db, label)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
