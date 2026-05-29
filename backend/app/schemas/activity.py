from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.auth import UserPublic


class ActivityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    board_id: int
    action_type: str
    payload: dict[str, Any]
    created_at: datetime
    user: UserPublic | None = None
    # Human-readable sentence (e.g. "Zain moved 'Onboarding' to Done").
    # Populated by the route/realtime layer; optional so ORM validation still works.
    message: str | None = None
