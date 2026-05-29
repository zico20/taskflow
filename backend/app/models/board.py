from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.activity import ActivityLog
    from app.models.column import Column
    from app.models.label import Label
    from app.models.user import User


class BoardRole(str, enum.Enum):
    owner = "owner"
    editor = "editor"
    viewer = "viewer"


class Board(Base, TimestampMixin):
    __tablename__ = "boards"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#58A6FF", nullable=False)

    owner: Mapped[User] = relationship(back_populates="owned_boards")
    members: Mapped[list[BoardMember]] = relationship(
        back_populates="board", cascade="all, delete-orphan"
    )
    columns: Mapped[list[Column]] = relationship(
        back_populates="board",
        cascade="all, delete-orphan",
        order_by="Column.position",
    )
    labels: Mapped[list[Label]] = relationship(
        back_populates="board", cascade="all, delete-orphan"
    )
    activity: Mapped[list[ActivityLog]] = relationship(
        back_populates="board", cascade="all, delete-orphan"
    )


class BoardMember(Base, TimestampMixin):
    __tablename__ = "board_members"
    __table_args__ = (
        UniqueConstraint("board_id", "user_id", name="uq_board_member"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(
        ForeignKey("boards.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    role: Mapped[BoardRole] = mapped_column(
        SAEnum(BoardRole, name="board_role"),
        default=BoardRole.editor,
        nullable=False,
    )

    board: Mapped[Board] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="memberships")
