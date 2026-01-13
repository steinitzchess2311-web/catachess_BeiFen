"""
Discussion endpoints router.
"""

from fastapi import APIRouter

from modules.workspace.api.endpoints import (
    discussions_threads,
    discussions_thread_state,
    discussions_replies,
    discussions_reactions,
    discussions_reply_history,
)

router = APIRouter(tags=["discussions"])
router.include_router(discussions_threads.router)
router.include_router(discussions_thread_state.router)
router.include_router(discussions_replies.router)
router.include_router(discussions_reactions.router)
router.include_router(discussions_reply_history.router)
