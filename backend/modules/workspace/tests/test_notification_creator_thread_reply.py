"""Notification creator thread/reply tests."""
from types import SimpleNamespace

import pytest

from modules.workspace.db.repos.discussion_reaction_repo import DiscussionReactionRepository
from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.notification_repo import NotificationRepository
from modules.workspace.db.tables.discussion_replies import DiscussionReply
from modules.workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from modules.workspace.events.subscribers.notification_creator import NotificationCreator
from modules.workspace.events.types import EventType


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


def _reply(reply_id: str, thread_id: str, author_id: str):
    return DiscussionReply(
        id=reply_id,
        thread_id=thread_id,
        parent_reply_id=None,
        quote_reply_id=None,
        author_id=author_id,
        content="reply",
        edited=False,
        edit_history=[],
        version=1,
    )


def _event(event_type: EventType, target_id: str, actor_id: str):
    return SimpleNamespace(
        type=event_type,
        actor_id=actor_id,
        target_id=target_id,
        target_type="discussion_reply",
        payload={},
    )


@pytest.mark.asyncio
async def test_reply_added_notifies_thread_author(session):
    session.add(_thread("u1", "t1"))
    session.add(_reply("r1", "t1", "u2"))
    await session.flush()
    creator = NotificationCreator(
        NotificationRepository(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        DiscussionReactionRepository(session),
    )
    await creator.handle_event(_event(EventType.DISCUSSION_REPLY_ADDED, "r1", "u2"))
    items = await NotificationRepository(session).list_by_user("u1")
    assert len(items) == 1


@pytest.mark.asyncio
async def test_reply_added_by_author_skips(session):
    session.add(_thread("u1", "t2"))
    session.add(_reply("r2", "t2", "u1"))
    await session.flush()
    creator = NotificationCreator(
        NotificationRepository(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        DiscussionReactionRepository(session),
    )
    await creator.handle_event(_event(EventType.DISCUSSION_REPLY_ADDED, "r2", "u1"))
    items = await NotificationRepository(session).list_by_user("u1")
    assert items == []


@pytest.mark.asyncio
async def test_thread_resolved_notifies_author(session):
    session.add(_thread("u5", "t3"))
    await session.flush()
    creator = NotificationCreator(
        NotificationRepository(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        DiscussionReactionRepository(session),
    )
    await creator.handle_event(_event(EventType.DISCUSSION_THREAD_RESOLVED, "t3", "u7"))
    items = await NotificationRepository(session).list_by_user("u5")
    assert len(items) == 1
