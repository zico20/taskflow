from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import TaskPriority
from app.schemas.label import LabelPublic


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    due_date: datetime | None = None
    priority: TaskPriority = TaskPriority.medium
    label_ids: list[int] = []


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    due_date: datetime | None = None
    priority: TaskPriority | None = None
    label_ids: list[int] | None = None


class TaskMove(BaseModel):
    """Move a task to a target column at a target index (0-based)."""

    column_id: int
    position: int = Field(ge=0)


class TaskPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    column_id: int
    title: str
    description: str | None
    due_date: datetime | None
    priority: TaskPriority
    position: int
    created_at: datetime
    updated_at: datetime
    labels: list[LabelPublic] = []


class ColumnWithTasks(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    name: str
    position: int
    tasks: list[TaskPublic] = []


class BoardSnapshot(BaseModel):
    """Full board state: columns with their ordered tasks. Used for initial load."""

    board_id: int
    columns: list[ColumnWithTasks]
