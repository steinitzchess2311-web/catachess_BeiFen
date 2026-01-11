"""Notification creator reaction tests."""
from types import SimpleNamespace

import pytest

from workspace.db.repos.discussion_reaction_repo import DiscussionReactionRepository
from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.notification_repo import NotificationRepository
from workspace.db.tables.discussion_reactions import DiscussionReaction
from workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from workspace.events.subscribers.notification_creator import NotificationCreator
from workspace.events.types import EventType


def _thread(author_id: str, thread_id: str):
    return DiscussionThread(
        id=thread_id,
        target_id="study-1",
        target_type="study",
        author_id=author_id,
        title="T",
        content="C",
        thread_type=ThreadType.NOTE,
        pinned=False,
        resolved=False,
        version=1,
    )


def _reaction(reaction_id: str, target_id: str, user_id: str):
    return DiscussionReaction(
        id=reaction_id,
        target_id=target_id,
        target_type="thread",
        user_id=user_id,
        emoji="👍",
    )


def _event(reaction_id: str, actor_id: str):
    return SimpleNamespace(
        type=EventType.DISCUSSION_REACTION_ADDED,
        actor_id=actor_id,
        target_id=reaction_id,
        target_type="discussion_reaction",
        payload={},
    )


@pytest.mark.asyncio
async def test_first_reaction_notifies_author(session):
    session.add(_thread("u1", "t1"))
    session.add(_reaction("r1", "t1", "u2"))
    await session.flush()
    creator = NotificationCreator(
        NotificationRepository(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        DiscussionReactionRepository(session),
    )
    await creator.handle_event(_event("r1", "u2"))
    items = await NotificationRepository(session).list_by_user("u1")
    assert len(items) == 1


@pytest.mark.asyncio
async def test_second_reaction_skips_notification(session):
    session.add(_thread("u3", "t2"))
    session.add_all([_reaction("r2", "t2", "u4"), _reaction("r3", "t2", "u5")])
    await session.flush()
    creator = NotificationCreator(
        NotificationRepository(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        DiscussionReactionRepository(session),
    )
    await creator.handle_event(_event("r3", "u5"))
    items = await NotificationRepository(session).list_by_user("u3")
    assert items == []
