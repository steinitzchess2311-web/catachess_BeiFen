"""Mention notifier reply add tests."""
from types import SimpleNamespace
import pytest
from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.event_repo import EventRepository
from workspace.db.repos.user_repo import UserRepository
from workspace.db.tables.discussion_replies import DiscussionReply
from workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from workspace.db.tables.users import User
from workspace.domain.models.event import EventQuery
from workspace.events.bus import EventBus
from workspace.events.subscribers.mention_notifier import MentionNotifier
from workspace.events.types import EventType


def _event(reply_id: str, actor_id: str):
    return SimpleNamespace(
        type=EventType.DISCUSSION_REPLY_ADDED, target_id=reply_id, actor_id=actor_id
    )


async def _seed_thread(session, thread_id: str):
    thread = DiscussionThread(
        id=thread_id,
        target_id="study-1",
        target_type="study",
        author_id="u0",
        title="T",
        content="base",
        thread_type=ThreadType.NOTE,
        pinned=False,
        resolved=False,
        version=1,
    )
    session.add(thread)
    await session.flush()


@pytest.mark.asyncio
async def test_reply_mentions_emitted(session):
    session.add(User(id="u1", username="alice"))
    await _seed_thread(session, "t1")
    session.add(
        DiscussionReply(
            id="r1",
            thread_id="t1",
            parent_reply_id=None,
            quote_reply_id=None,
            author_id="u9",
            content="Hi @alice",
            edited=False,
            edit_history=[],
            version=1,
        )
    )
    await session.flush()
    notifier = MentionNotifier(
        EventBus(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        UserRepository(session),
    )
    await notifier.handle_event(_event("r1", "u9"))
    events = await EventRepository(session).query_events(
        EventQuery(event_type=EventType.DISCUSSION_MENTION)
    )
    assert len(events) == 1


@pytest.mark.asyncio
async def test_reply_unknown_user_ignored(session):
    await _seed_thread(session, "t2")
    session.add(
        DiscussionReply(
            id="r2",
            thread_id="t2",
            parent_reply_id=None,
            quote_reply_id=None,
            author_id="u9",
            content="Hi @ghost",
            edited=False,
            edit_history=[],
            version=1,
        )
    )
    await session.flush()
    notifier = MentionNotifier(
        EventBus(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        UserRepository(session),
    )
    await notifier.handle_event(_event("r2", "u9"))
    events = await EventRepository(session).query_events(
        EventQuery(event_type=EventType.DISCUSSION_MENTION)
    )
    assert len(events) == 0
