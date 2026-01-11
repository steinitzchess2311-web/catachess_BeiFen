from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from workspace.api.deps import get_event_bus
from workspace.db.repos.discussion_reaction_repo import DiscussionReactionRepository
from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.session import get_session
from workspace.domain.services.discussion.reaction_service import ReactionService
from workspace.domain.services.discussion.reply_service import ReplyService
from workspace.domain.services.discussion.thread_service import ThreadService
from workspace.domain.services.discussion.thread_state_service import ThreadStateService
from workspace.events.bus import EventBus


async def get_thread_repo(
    session: AsyncSession = Depends(get_session),
) -> DiscussionThreadRepository:
    return DiscussionThreadRepository(session)


async def get_reply_repo(
    session: AsyncSession = Depends(get_session),
) -> DiscussionReplyRepository:
    return DiscussionReplyRepository(session)


async def get_reaction_repo(
    session: AsyncSession = Depends(get_session),
) -> DiscussionReactionRepository:
    return DiscussionReactionRepository(session)


async def get_thread_service(
    session: AsyncSession = Depends(get_session),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    event_bus: EventBus = Depends(get_event_bus),
) -> ThreadService:
    return ThreadService(session, thread_repo, event_bus)


async def get_reply_service(
    session: AsyncSession = Depends(get_session),
    reply_repo: DiscussionReplyRepository = Depends(get_reply_repo),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    event_bus: EventBus = Depends(get_event_bus),
) -> ReplyService:
    return ReplyService(session, reply_repo, thread_repo, event_bus)


async def get_reaction_service(
    session: AsyncSession = Depends(get_session),
    reaction_repo: DiscussionReactionRepository = Depends(get_reaction_repo),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    reply_repo: DiscussionReplyRepository = Depends(get_reply_repo),
    event_bus: EventBus = Depends(get_event_bus),
) -> ReactionService:
    return ReactionService(session, reaction_repo, thread_repo, reply_repo, event_bus)


async def get_thread_state_service(
    session: AsyncSession = Depends(get_session),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    event_bus: EventBus = Depends(get_event_bus),
) -> ThreadStateService:
    return ThreadStateService(session, thread_repo, event_bus)
