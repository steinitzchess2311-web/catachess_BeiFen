"""
Mention notifier thread tests.
"""

from types import SimpleNamespace

import pytest

from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.event_repo import EventRepository
from workspace.db.repos.user_repo import UserRepository
from workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from workspace.db.tables.users import User
from workspace.domain.models.event import EventQuery
from workspace.events.bus import EventBus
from workspace.events.subscribers.mention_notifier import MentionNotifier
from workspace.events.types import EventType


def _thread_event(event_type: EventType, thread_id: str, actor_id: str):
    return SimpleNamespace(type=event_type, target_id=thread_id, actor_id=actor_id)


@pytest.mark.asyncio
async def test_thread_mentions_emitted(session):
    session.add_all([User(id="u1", username="alice"), User(id="u2", username="bob")])
    thread = DiscussionThread(
        id="t1",
        target_id="study-1",
        target_type="study",
        author_id="u0",
        title="T",
        content="Hi @alice and @bob",
        thread_type=ThreadType.NOTE,
        pinned=False,
        resolved=False,
        version=1,
    )
    session.add(thread)
    await session.flush()
    bus = EventBus(session)
    notifier = MentionNotifier(
        bus,
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        UserRepository(session),
    )
    await notifier.handle_event(
        _thread_event(EventType.DISCUSSION_THREAD_CREATED, "t1", "u0")
    )
    events = await EventRepository(session).query_events(
        EventQuery(event_type=EventType.DISCUSSION_MENTION)
    )
    assert {
        event.payload["payload"]["mentioned_user"] for event in events
    } == {"alice", "bob"}


@pytest.mark.asyncio
async def test_thread_unknown_user_ignored(session):
    thread = DiscussionThread(
        id="t2",
        target_id="study-1",
        target_type="study",
        author_id="u0",
        title="T",
        content="Hi @nobody",
        thread_type=ThreadType.NOTE,
        pinned=False,
        resolved=False,
        version=1,
    )
    session.add(thread)
    await session.flush()
    bus = EventBus(session)
    notifier = MentionNotifier(
        bus,
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        UserRepository(session),
    )
    await notifier.handle_event(
        _thread_event(EventType.DISCUSSION_THREAD_CREATED, "t2", "u0")
    )
    events = await EventRepository(session).query_events(
        EventQuery(event_type=EventType.DISCUSSION_MENTION)
    )
    assert len(events) == 0
