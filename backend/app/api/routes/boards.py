from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_board_editor,
    require_board_owner,
    require_board_viewer,
)
from app.db.session import get_db
from app.models.board import Board
from app.models.user import User
from app.schemas.board import (
    BoardCreate,
    BoardDetail,
    BoardMemberAdd,
    BoardMemberPublic,
    BoardSummary,
    BoardUpdate,
    MemberRoleUpdate,
)
from app.services import board_service
from app.services.realtime import record_and_broadcast

router = APIRouter(prefix="/boards", tags=["boards"])


@router.get("", response_model=list[BoardSummary])
async def list_boards(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[BoardSummary]:
    rows = await board_service.list_boards(db, user=user)
    return [
        BoardSummary(
            id=b.id,
            name=b.name,
            description=b.description,
            color=b.color,
            owner_id=b.owner_id,
            created_at=b.created_at,
            updated_at=b.updated_at,
            role=role,
            task_count=count,
        )
        for b, role, count in rows
    ]


@router.post("", response_model=BoardSummary, status_code=status.HTTP_201_CREATED)
async def create_board(
    payload: BoardCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BoardSummary:
    board = await board_service.create_board(db, owner=user, data=payload)
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="board.created",
        payload={"name": board.name},
    )
    return BoardSummary.model_validate(board)


@router.get("/{board_id}", response_model=BoardDetail)
async def get_board(
    board: Board = Depends(require_board_viewer),
    db: AsyncSession = Depends(get_db),
) -> BoardDetail:
    detail = await board_service.get_board_detail(db, board_id=board.id)
    return BoardDetail(
        id=detail.id,
        name=detail.name,
        description=detail.description,
        color=detail.color,
        owner_id=detail.owner_id,
        created_at=detail.created_at,
        updated_at=detail.updated_at,
        role=getattr(board, "_current_user_role", None),
        members=[BoardMemberPublic.model_validate(m) for m in detail.members],
    )


@router.patch("/{board_id}", response_model=BoardSummary)
async def update_board(
    payload: BoardUpdate,
    board: Board = Depends(require_board_editor),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BoardSummary:
    updated = await board_service.update_board(db, board=board, data=payload)
    await record_and_broadcast(
        db,
        board_id=updated.id,
        actor=user,
        action_type="board.updated",
        payload={"name": updated.name},
        ws_event="board.updated",
        ws_data={"id": updated.id, "name": updated.name, "color": updated.color},
    )
    return BoardSummary.model_validate(updated)


@router.delete(
    "/{board_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def delete_board(
    board: Board = Depends(require_board_owner),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await board_service.delete_board(db, board=board)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{board_id}/members", response_model=BoardMemberPublic, status_code=201)
async def add_member(
    payload: BoardMemberAdd,
    board: Board = Depends(require_board_owner),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BoardMemberPublic:
    member_user, role = await board_service.add_member(
        db, board=board, email=payload.email, role=payload.role
    )
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="member.added",
        payload={"member_name": member_user.name},
    )
    return BoardMemberPublic(user=member_user, role=role)


@router.patch(
    "/{board_id}/members/{user_id}", response_model=BoardMemberPublic
)
async def update_member_role(
    user_id: int,
    payload: MemberRoleUpdate,
    board: Board = Depends(require_board_owner),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> BoardMemberPublic:
    member_user, role = await board_service.change_member_role(
        db, board=board, user_id=user_id, role=payload.role
    )
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="member.role_changed",
        payload={"member_name": member_user.name, "role": role.value},
    )
    return BoardMemberPublic(user=member_user, role=role)


@router.delete(
    "/{board_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
async def remove_member(
    user_id: int,
    board: Board = Depends(require_board_owner),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Response:
    removed_user = await board_service.remove_member(
        db, board=board, user_id=user_id
    )
    await record_and_broadcast(
        db,
        board_id=board.id,
        actor=user,
        action_type="member.removed",
        payload={"member_name": removed_user.name},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
