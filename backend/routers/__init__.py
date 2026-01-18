"""
Routers package - HTTP API endpoints
"""
from . import auth, assignments, user_profile, game_storage, chess_engine, chess_rules

__all__ = [
    "auth",
    "assignments",
    "user_profile",
    "game_storage",
    "chess_engine",
    "chess_rules",
]
