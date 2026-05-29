"""slowapi rate limiter shared across the app.

We expose the Limiter (for error-handler wiring) and a small FastAPI dependency
that applies the auth rate limit. We use a dependency rather than slowapi's
`@limiter.limit` decorator because the decorator wraps the route function and
breaks FastAPI's request-body introspection (Pydantic bodies get mis-detected as
query params). The dependency calls the underlying `limits` strategy directly.
"""
from __future__ import annotations

from fastapi import Request
from limits import parse_many
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(key_func=get_remote_address)

# Parse the configured limit once at import time.
_AUTH_LIMITS = parse_many(settings.AUTH_RATE_LIMIT)


async def auth_rate_limit(request: Request) -> None:
    """Enforce the configured auth rate limit per client IP.

    Raises RateLimitExceeded (handled globally -> 429 in our error shape) when
    the limit is exceeded.
    """
    key = get_remote_address(request)
    strategy = limiter.limiter  # limits.strategies.RateLimiter
    for item in _AUTH_LIMITS:
        if not strategy.test(item, key, "auth"):
            raise RateLimitExceeded(item)
        strategy.hit(item, key, "auth")
