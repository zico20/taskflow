from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    activity,
    auth,
    boards,
    checklist,
    columns,
    comments,
    labels,
    tasks,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(boards.router)
api_router.include_router(columns.router)
api_router.include_router(tasks.router)
api_router.include_router(labels.router)
api_router.include_router(activity.router)
api_router.include_router(checklist.router)
api_router.include_router(comments.router)
