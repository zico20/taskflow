"""Pytest fixtures providing an isolated in-memory database per test.

Each test gets a fresh schema on a shared in-memory SQLite connection (StaticPool),
so there is no cross-test bleed and no on-disk artifacts. The app's `get_db`
dependency is overridden to use the test session factory.
"""
from __future__ import annotations

import os

# Configure the environment BEFORE importing the app/settings.
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
# Loosen the auth rate limit so tests aren't throttled.
os.environ.setdefault("AUTH_RATE_LIMIT", "1000/minute")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (register models)
from app.db.base import Base
from app.db.session import get_db
from app.main import create_app


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # one shared in-memory connection
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session_factory(engine):
    return async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def db(session_factory) -> AsyncSession:
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def app(session_factory):
    application = create_app()

    async def _override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    application.dependency_overrides[get_db] = _override_get_db
    # Let the WebSocket route share the same in-memory test DB.
    application.state.session_factory = session_factory
    yield application
    application.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(app) -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport, base_url="http://test"
    ) as ac:
        yield ac


# --- Helpers ---
async def register(
    client: AsyncClient,
    email: str,
    password: str = "password123",
    name: str = "Test User",
):
    resp = await client.post(
        "/api/auth/signup",
        json={"email": email, "password": password, "name": name},
    )
    return resp


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient):
    """A client already signed up & authenticated (cookie set on the client)."""
    resp = await register(client, "owner@example.com")
    assert resp.status_code == 201, resp.text
    return client
