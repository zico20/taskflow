"""Import all models here so Alembic / metadata sees them."""
from app.models.activity import ActivityLog
from app.models.board import Board, BoardMember, BoardRole
from app.models.column import Column
from app.models.label import Label, TaskLabel
from app.models.task import Task, TaskPriority
from app.models.user import User

__all__ = [
    "User",
    "Board",
    "BoardMember",
    "BoardRole",
    "Column",
    "Task",
    "TaskPriority",
    "Label",
    "TaskLabel",
    "ActivityLog",
]
