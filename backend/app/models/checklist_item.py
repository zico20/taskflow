from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.task import Task


class ChecklistItem(Base, TimestampMixin):
    """A single checklist (subtask) entry belonging to one task."""

    __tablename__ = "checklist_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), index=True, nullable=False
    )
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Gapped positions, like tasks/columns, so reordering rarely needs a full rewrite.
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    task: Mapped[Task] = relationship(back_populates="checklist_items")
