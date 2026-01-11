"""
Mention notifier thread update tests.
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


def _event(thread_id: str, actor_id: str):
    return SimpleNamespace(
        type=EventType.DISCUSSION_THREAD_UPDATED,
        target_id=thread_id,
        actor_id=actor_id,
    )


@pytest.mark.asyncio
async def test_thread_update_emits_mentions(session):
    session.add(User(id="u3", username="alice"))
    thread = DiscussionThread(
        id="t3",
        target_id="study-1",
        target_type="study",
        author_id="u0",
        title="T",
        content="Updated @alice",
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
    await notifier.handle_event(_event("t3", "u0"))
    events = await EventRepository(session).query_events(
        EventQuery(event_type=EventType.DISCUSSION_MENTION)
    )
    assert len(events) == 1
