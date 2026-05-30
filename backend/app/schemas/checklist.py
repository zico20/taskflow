from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ChecklistItemCreate(BaseModel):
    # Trim BEFORE length validation so a whitespace-only value collapses to "" and
    # is rejected by min_length with a clean, serializable built-in error.
    content: str = Field(min_length=1, max_length=500)

    @field_validator("content", mode="before")
    @classmethod
    def _trim(cls, v: object) -> object:
        return v.strip() if isinstance(v, str) else v


class ChecklistItemUpdate(BaseModel):
    content: str | None = Field(default=None, min_length=1, max_length=500)
    is_done: bool | None = None

    @field_validator("content", mode="before")
    @classmethod
    def _trim(cls, v: object) -> object:
        return v.strip() if isinstance(v, str) else v


class ChecklistReorder(BaseModel):
    item_ids: list[int]


class ChecklistItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    content: str
    is_done: bool
    position: int
    created_at: datetime
    updated_at: datetime
