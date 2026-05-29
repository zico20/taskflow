from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import auth_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    UserCreate,
    UserLogin,
    UserPublic,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        path="/",
    )


@router.post(
    "/signup",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(auth_rate_limit)],
)
async def signup(
    response: Response,
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    user, token = await auth_service.register_user(
        db, email=payload.email, password=payload.password, name=payload.name
    )
    _set_auth_cookie(response, token)
    return user


@router.post(
    "/login",
    response_model=UserPublic,
    dependencies=[Depends(auth_rate_limit)],
)
async def login(
    response: Response,
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> User:
    user, token = await auth_service.authenticate_user(
        db, email=payload.email, password=payload.password
    )
    _set_auth_cookie(response, token)
    return user


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response) -> MessageResponse:
    response.delete_cookie(
        settings.COOKIE_NAME, path="/", domain=settings.COOKIE_DOMAIN
    )
    return MessageResponse(message="Logged out.")


@router.get("/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post(
    "/password-reset/request",
    response_model=MessageResponse,
    dependencies=[Depends(auth_rate_limit)],
)
async def password_reset_request(
    payload: PasswordResetRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await auth_service.request_password_reset(db, email=payload.email)
    # Always the same response to avoid leaking which emails are registered.
    return MessageResponse(
        message="If an account exists for that email, a reset link has been sent."
    )


@router.post(
    "/password-reset/confirm",
    response_model=MessageResponse,
    dependencies=[Depends(auth_rate_limit)],
)
async def password_reset_confirm(
    payload: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await auth_service.confirm_password_reset(
        db, token=payload.token, new_password=payload.new_password
    )
    return MessageResponse(message="Password updated. You can now log in.")
