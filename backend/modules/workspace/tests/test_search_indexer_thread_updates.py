"""Search indexer thread update tests."""
from types import SimpleNamespace

import pytest

from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.search_index_repo import SearchIndexRepository
from workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from workspace.events.subscribers.search_indexer import SearchIndexer
from workspace.events.types import EventType


def _event(event_type: EventType, target_id: str):
    return SimpleNamespace(type=event_type, target_id=target_id)


def _thread(thread_id: str, content: str):
    return DiscussionThread(
        id=thread_id,
        target_id="study-1",
        target_type="study",
        author_id="u1",
        title="Title",
        content=content,
        thread_type=ThreadType.NOTE,
        pinned=False,
        resolved=False,
        version=1,
    )


@pytest.mark.asyncio
async def test_thread_update_refreshes_content(session):
    thread = _thread("t1", "Old content")
    session.add(thread)
    await session.flush()
    indexer = SearchIndexer(
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        SearchIndexRepository(session),
    )
    await indexer.handle_event(_event(EventType.DISCUSSION_THREAD_CREATED, "t1"))
    thread.content = "New content"
    await session.flush()
    await indexer.handle_event(_event(EventType.DISCUSSION_THREAD_UPDATED, "t1"))
    entry = await SearchIndexRepository(session).get_by_target("t1", "discussion_thread")
    assert entry and "New content" in entry.content


@pytest.mark.asyncio
async def test_thread_delete_removes_entry(session):
    session.add(_thread("t2", "content"))
    await session.flush()
    indexer = SearchIndexer(
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        SearchIndexRepository(session),
    )
    await indexer.handle_event(_event(EventType.DISCUSSION_THREAD_CREATED, "t2"))
    await indexer.handle_event(_event(EventType.DISCUSSION_THREAD_DELETED, "t2"))
    entry = await SearchIndexRepository(session).get_by_target("t2", "discussion_thread")
    assert entry is None


@pytest.mark.asyncio
async def test_missing_thread_ignored(session):
    indexer = SearchIndexer(
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        SearchIndexRepository(session),
    )
    await indexer.handle_event(_event(EventType.DISCUSSION_THREAD_CREATED, "missing"))
    entry = await SearchIndexRepository(session).get_by_target("missing", "discussion_thread")
    assert entry is None
