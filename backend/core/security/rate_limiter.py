"""
Rate Limiter for Authentication Endpoints

Simple in-memory rate limiter to prevent brute-force attacks
on authentication endpoints like login, register, etc.
"""

import time
from collections import deque
from typing import Callable
from fastapi import Request, HTTPException, status


class RateLimiter:
    """
    Simple in-memory sliding window rate limiter.

    Tracks requests per key (e.g., IP address) and enforces limits.
    """

    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = {}

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        """
        Check if a request should be allowed.

        Args:
            key: Unique identifier (e.g., IP address, user ID)
            limit: Maximum requests allowed in the window
            window_seconds: Time window in seconds

        Returns:
            True if request is allowed, False if rate limit exceeded
        """
        if limit <= 0:
            return True

        now = time.monotonic()
        bucket = self._buckets.get(key)
        if bucket is None:
            bucket = deque()
            self._buckets[key] = bucket

        # Remove old entries outside the window
        cutoff = now - window_seconds
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        # Check if limit exceeded
        if len(bucket) >= limit:
            return False

        # Record this request
        bucket.append(now)
        return True

    def reset(self, key: str | None = None) -> None:
        """
        Reset rate limit tracking.

        Args:
            key: If provided, reset only for this key. Otherwise, reset all.
        """
        if key is None:
            self._buckets.clear()
        else:
            self._buckets.pop(key, None)


# Global rate limiter instance
_rate_limiter = RateLimiter()


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    return _rate_limiter


def rate_limit(limit: int, window_seconds: int, key_func: Callable[[Request], str] | None = None):
    """
    Dependency to enforce rate limiting on endpoints.

    Args:
        limit: Maximum requests allowed in the window
        window_seconds: Time window in seconds
        key_func: Optional function to extract key from request (defaults to client IP)

    Usage:
        @router.post("/login", dependencies=[Depends(rate_limit(5, 60))])
        def login(...):
            ...
    """
    def dependency(request: Request):
        # Default to client IP as the rate limit key
        if key_func:
            key = key_func(request)
        else:
            # Get client IP from X-Forwarded-For or fall back to client.host
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                key = forwarded.split(",")[0].strip()
            else:
                key = request.client.host if request.client else "unknown"

        # Check rate limit
        limiter = get_rate_limiter()
        if not limiter.allow(key, limit, window_seconds):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {window_seconds} seconds.",
                headers={"Retry-After": str(window_seconds)},
            )

    return dependency
