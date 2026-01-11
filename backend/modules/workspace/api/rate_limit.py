"""
Simple in-memory rate limiter for API endpoints.
"""

import time
from collections import deque


class RateLimiter:
    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = {}

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        if limit <= 0:
            return True
        now = time.monotonic()
        bucket = self._buckets.get(key)
        if bucket is None:
            bucket = deque()
            self._buckets[key] = bucket

        cutoff = now - window_seconds
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= limit:
            return False

        bucket.append(now)
        return True

    def reset(self, key: str | None = None) -> None:
        if key is None:
            self._buckets.clear()
        else:
            self._buckets.pop(key, None)
