"""Search indexer reply update tests."""
from types import SimpleNamespace

import pytest

from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.search_index_repo import SearchIndexRepository
from modules.workspace.db.tables.discussion_replies import DiscussionReply
from modules.workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from modules.workspace.events.subscribers.search_indexer import SearchIndexer
from modules.workspace.events.types import EventType


def _event(event_type: EventType, target_id: str):
    return SimpleNamespace(type=event_type, target_id=target_id)


@pytest.mark.asyncio
async def test_reply_edit_updates_content(session):
    session.add(
        DiscussionThread(
            id="t1",
            target_id="study-1",
            target_type="study",
            author_id="u1",
            title="T",
            content="C",
            thread_type=ThreadType.NOTE,
            pinned=False,
            resolved=False,
            version=1,
        )
    )
    reply = DiscussionReply(
        id="r1",
        thread_id="t1",
        parent_reply_id=None,
        quote_reply_id=None,
        author_id="u2",
        content="Old reply",
        edited=False,
        edit_history=[],
        version=1,
    )
    session.add(reply)
    await session.flush()
    indexer = SearchIndexer(
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        SearchIndexRepository(session),
    )
    await indexer.handle_event(_event(EventType.DISCUSSION_REPLY_ADDED, "r1"))
    reply.content = "New reply"
    await session.flush()
    await indexer.handle_event(_event(EventType.DISCUSSION_REPLY_EDITED, "r1"))
    entry = await SearchIndexRepository(session).get_by_target("r1", "discussion_reply")
    assert entry and entry.content == "New reply"
