from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.auth import UserPublic


class CommentCreate(BaseModel):
    # Trim BEFORE length validation so whitespace-only collapses to "" → 422.
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content", mode="before")
    @classmethod
    def _trim(cls, v: object) -> object:
        return v.strip() if isinstance(v, str) else v


class CommentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    content: str
    author: UserPublic
    created_at: datetime
