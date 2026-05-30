from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.board import BoardRole
from app.schemas.auth import UserPublic


class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    color: str = Field(default="#58A6FF", max_length=20)


class BoardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    color: str | None = Field(default=None, max_length=20)


class BoardMemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserPublic
    role: BoardRole


class BoardMemberAdd(BaseModel):
    email: str
    role: BoardRole = BoardRole.editor


class MemberRoleUpdate(BaseModel):
    """Change an existing member's role. Owner is not assignable here."""

    role: BoardRole


class BoardSummary(BaseModel):
    """Board card data for the list view."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    color: str
    owner_id: int
    created_at: datetime
    updated_at: datetime
    role: BoardRole | None = None
    task_count: int = 0


class BoardDetail(BoardSummary):
    members: list[BoardMemberPublic] = []
