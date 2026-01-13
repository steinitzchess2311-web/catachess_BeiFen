"""
Mention notifier reply edit tests.
"""

from types import SimpleNamespace

import pytest

from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.event_repo import EventRepository
from modules.workspace.db.repos.user_repo import UserRepository
from modules.workspace.db.tables.discussion_replies import DiscussionReply
from modules.workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from modules.workspace.db.tables.users import User
from modules.workspace.domain.models.event import EventQuery
from modules.workspace.events.bus import EventBus
from modules.workspace.events.subscribers.mention_notifier import MentionNotifier
from modules.workspace.events.types import EventType


def _event(reply_id: str, actor_id: str):
    return SimpleNamespace(
        type=EventType.DISCUSSION_REPLY_EDITED, target_id=reply_id, actor_id=actor_id
    )


@pytest.mark.asyncio
async def test_reply_edit_emits_mentions(session):
    session.add(User(id="u2", username="bob"))
    session.add(
        DiscussionThread(
            id="t1",
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
    )
    session.add(
        DiscussionReply(
            id="r1",
            thread_id="t1",
            parent_reply_id=None,
            quote_reply_id=None,
            author_id="u9",
            content="Edit @bob",
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
