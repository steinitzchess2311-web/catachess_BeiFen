"""
Blog Redis Cache Service

Caching strategy:
- Article list: 5 minutes
- Article detail: 10 minutes
- Categories: 1 hour
- Pinned articles: 5 minutes
"""
import json
import os
from typing import Optional, Any, List
import redis.asyncio as redis
from redis.asyncio import Redis


class BlogCacheService:
    """Redis cache service for blog module"""

    def __init__(self):
        self.redis_client: Optional[Redis] = None
        self._ttl = {
            "article_list": 300,      # 5 minutes
            "article_detail": 600,    # 10 minutes
            "categories": 3600,       # 1 hour
            "pinned_articles": 300,   # 5 minutes
        }

    async def connect(self):
        """Connect to Redis"""
        if self.redis_client is not None:
            return

        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            print("⚠️  REDIS_URL not configured, caching disabled")
            return

        try:
            self.redis_client = await redis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            await self.redis_client.ping()
            print("✅ Blog cache service connected to Redis")
        except Exception as e:
            print(f"⚠️  Failed to connect to Redis: {e}")
            self.redis_client = None

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()

    def _is_available(self) -> bool:
        """Check if Redis is available"""
        return self.redis_client is not None

    # ==================== Article List ====================

    async def get_article_list(self, category: str, page: int) -> Optional[dict]:
        """Get cached article list"""
        if not self._is_available():
            return None

        try:
            key = f"blog:articles:list:{category}:{page}"
            data = await self.redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None

    async def set_article_list(self, category: str, page: int, data: dict):
        """Cache article list"""
        if not self._is_available():
            return

        try:
            key = f"blog:articles:list:{category}:{page}"
            await self.redis_client.setex(
                key,
                self._ttl["article_list"],
                json.dumps(data, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Cache set error: {e}")

    async def invalidate_article_list(self, category: str):
        """Invalidate article list cache for a category"""
        if not self._is_available():
            return

        try:
            # Delete all pages for this category
            pattern = f"blog:articles:list:{category}:*"
            async for key in self.redis_client.scan_iter(match=pattern):
                await self.redis_client.delete(key)
        except Exception as e:
            print(f"Cache invalidate error: {e}")

    # ==================== Article Detail ====================

    async def get_article(self, article_id: str) -> Optional[dict]:
        """Get cached article detail"""
        if not self._is_available():
            return None

        try:
            key = f"blog:article:{article_id}"
            data = await self.redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None

    async def set_article(self, article_id: str, data: dict):
        """Cache article detail"""
        if not self._is_available():
            return

        try:
            key = f"blog:article:{article_id}"
            await self.redis_client.setex(
                key,
                self._ttl["article_detail"],
                json.dumps(data, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Cache set error: {e}")

    async def invalidate_article(self, article_id: str):
        """Invalidate article detail cache"""
        if not self._is_available():
            return

        try:
            key = f"blog:article:{article_id}"
            await self.redis_client.delete(key)
        except Exception as e:
            print(f"Cache invalidate error: {e}")

    # ==================== Pinned Articles ====================

    async def get_pinned_articles(self) -> Optional[List[dict]]:
        """Get cached pinned articles"""
        if not self._is_available():
            return None

        try:
            key = "blog:articles:pinned"
            data = await self.redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None

    async def set_pinned_articles(self, data: List[dict]):
        """Cache pinned articles"""
        if not self._is_available():
            return

        try:
            key = "blog:articles:pinned"
            await self.redis_client.setex(
                key,
                self._ttl["pinned_articles"],
                json.dumps(data, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Cache set error: {e}")

    async def invalidate_pinned_articles(self):
        """Invalidate pinned articles cache"""
        if not self._is_available():
            return

        try:
            key = "blog:articles:pinned"
            await self.redis_client.delete(key)
        except Exception as e:
            print(f"Cache invalidate error: {e}")

    # ==================== Categories ====================

    async def get_categories(self) -> Optional[List[dict]]:
        """Get cached categories"""
        if not self._is_available():
            return None

        try:
            key = "blog:categories"
            data = await self.redis_client.get(key)
            if data:
                return json.loads(data)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None

    async def set_categories(self, data: List[dict]):
        """Cache categories"""
        if not self._is_available():
            return

        try:
            key = "blog:categories"
            await self.redis_client.setex(
                key,
                self._ttl["categories"],
                json.dumps(data, ensure_ascii=False)
            )
        except Exception as e:
            print(f"Cache set error: {e}")

    async def invalidate_categories(self):
        """Invalidate categories cache"""
        if not self._is_available():
            return

        try:
            key = "blog:categories"
            await self.redis_client.delete(key)
        except Exception as e:
            print(f"Cache invalidate error: {e}")

    # ==================== View Count (Real-time tracking) ====================

    async def increment_view(self, article_id: str) -> int:
        """Increment article view count in Redis (will be synced to DB later)"""
        if not self._is_available():
            return 0

        try:
            key = f"blog:views:{article_id}"
            return await self.redis_client.incr(key)
        except Exception as e:
            print(f"Cache incr error: {e}")
            return 0

    async def get_view_count(self, article_id: str) -> int:
        """Get view count from Redis"""
        if not self._is_available():
            return 0

        try:
            key = f"blog:views:{article_id}"
            count = await self.redis_client.get(key)
            return int(count) if count else 0
        except Exception as e:
            print(f"Cache get error: {e}")
            return 0

    async def sync_views_to_db(self):
        """Get all view counts for batch update to database"""
        if not self._is_available():
            return {}

        try:
            views = {}
            pattern = "blog:views:*"
            async for key in self.redis_client.scan_iter(match=pattern):
                article_id = key.replace("blog:views:", "")
                count = await self.redis_client.get(key)
                if count:
                    views[article_id] = int(count)
            return views
        except Exception as e:
            print(f"Cache sync error: {e}")
            return {}

    # ==================== Cache Management ====================

    async def clear_all_blog_cache(self):
        """Clear all blog-related cache (emergency use)"""
        if not self._is_available():
            return

        try:
            pattern = "blog:*"
            keys_deleted = 0
            async for key in self.redis_client.scan_iter(match=pattern):
                await self.redis_client.delete(key)
                keys_deleted += 1
            print(f"✅ Cleared {keys_deleted} blog cache keys")
        except Exception as e:
            print(f"Cache clear error: {e}")

    async def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        if not self._is_available():
            return {"status": "disabled"}

        try:
            info = await self.redis_client.info("stats")
            return {
                "status": "connected",
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0),
                "hit_rate": round(
                    info.get("keyspace_hits", 0) /
                    max(info.get("keyspace_hits", 0) + info.get("keyspace_misses", 0), 1) * 100,
                    2
                ) if info.get("keyspace_hits") else 0
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}


# Global cache service instance
_cache_service: Optional[BlogCacheService] = None


async def get_blog_cache() -> BlogCacheService:
    """Get or create blog cache service instance"""
    global _cache_service
    if _cache_service is None:
        _cache_service = BlogCacheService()
        await _cache_service.connect()
    return _cache_service
