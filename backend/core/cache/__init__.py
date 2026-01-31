"""
Engine Analysis Cache Module

MongoDB-based global cache for chess engine analysis results.
"""

from .mongodb import MongoEngineCache, get_mongo_cache

__all__ = [
    'MongoEngineCache',
    'get_mongo_cache',
]
