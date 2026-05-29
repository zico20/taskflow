from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ColumnCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class ColumnUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)


class ColumnReorder(BaseModel):
    """New ordering of all column ids on the board, front to back."""

    column_ids: list[int]


class ColumnPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    name: str
    position: int
