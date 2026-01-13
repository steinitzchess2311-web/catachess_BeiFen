"""
Discussion search integration tests.
"""

import pytest

from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.search_index_repo import SearchIndexRepository
from modules.workspace.domain.models.discussion_reply import AddReplyCommand
from modules.workspace.domain.models.discussion_thread import CreateThreadCommand, UpdateThreadCommand
from modules.workspace.domain.services.discussion.reply_service import ReplyService
from modules.workspace.domain.services.discussion.thread_service import ThreadService
from modules.workspace.domain.services.discussion.thread_state_service import ThreadStateService


async def _seed_data(thread_service, reply_service, count_threads=50, replies_per_thread=4):
    threads = []
    for i in range(count_threads):
        thread = await thread_service.create_thread(
            CreateThreadCommand(
                target_id="study-1",
                target_type="study",
                author_id=f"user-{i % 5}",
                title=f"Chess topic {i}",
                content=f"Chess analysis #{i}",
                thread_type="note",
            )
        )
        threads.append(thread)
        for j in range(replies_per_thread):
            await reply_service.add_reply(
                AddReplyCommand(
                    thread_id=thread.id,
                    author_id=f"user-{j % 3}",
                    content=f"Reply {j} on chess #{i}",
                )
            )
    return threads


@pytest.mark.asyncio
async def test_thread_indexed_on_create(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Index me",
            content="Chess content",
            thread_type="note",
        )
    )
    entry = await search_repo.get_by_target(thread.id, "discussion_thread")
    assert entry is not None


@pytest.mark.asyncio
async def test_reply_indexed_on_add(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Thread",
            content="Chess content",
            thread_type="note",
        )
    )
    reply = await reply_service.add_reply(
        AddReplyCommand(
            thread_id=thread.id,
            author_id="user-2",
            content="Reply chess",
        )
    )
    entry = await search_repo.get_by_target(reply.id, "discussion_reply")
    assert entry is not None


@pytest.mark.asyncio
async def test_search_by_keyword(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)

    await _seed_data(thread_service, reply_service, count_threads=50, replies_per_thread=4)

    results = await search_repo.search("chess", target_type="discussion_thread")
    assert len(results) >= 20


@pytest.mark.asyncio
async def test_search_by_author(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)

    await _seed_data(thread_service, reply_service, count_threads=10, replies_per_thread=2)

    results = await search_repo.search("Chess", author_id="user-1")
    assert all(entry.author_id == "user-1" for entry in results)


@pytest.mark.asyncio
async def test_search_excludes_deleted(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    state_service = ThreadStateService(session, thread_repo, event_bus)
    reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)

    threads = await _seed_data(thread_service, reply_service, count_threads=3, replies_per_thread=1)

    await state_service.delete_thread(threads[0].id)
    results = await search_repo.search("Chess", target_type="discussion_thread")
    ids = {entry.target_id for entry in results}
    assert threads[0].id not in ids


@pytest.mark.asyncio
async def test_search_ranking(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)

    thread_a = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Chess A",
            content="Chess content A",
            thread_type="note",
        )
    )
    thread_b = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-2",
            title="Chess B",
            content="Chess content B",
            thread_type="note",
        )
    )
    await thread_service.update_thread(
        UpdateThreadCommand(
            thread_id=thread_b.id,
            title=thread_b.title,
            content=thread_b.content + " updated",
            actor_id="user-2",
            version=thread_b.version,
        )
    )

    results = await search_repo.search("Chess", target_type="discussion_thread", limit=2)
    assert results[0].target_id == thread_b.id
    assert results[1].target_id == thread_a.id


@pytest.mark.asyncio
async def test_search_pagination(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)

    await _seed_data(thread_service, reply_service, count_threads=30, replies_per_thread=1)

    page_1 = await search_repo.search("Chess", target_type="discussion_thread", limit=10, offset=0)
    page_2 = await search_repo.search("Chess", target_type="discussion_thread", limit=10, offset=10)
    assert page_1
    assert page_2
    assert {entry.id for entry in page_1}.isdisjoint({entry.id for entry in page_2})


@pytest.mark.asyncio
async def test_index_updated_on_edit(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Chess old",
            content="Chess old",
            thread_type="note",
        )
    )
    await thread_service.update_thread(
        UpdateThreadCommand(
            thread_id=thread.id,
            title="Chess new",
            content="Chess new",
            actor_id="user-1",
            version=thread.version,
        )
    )
    entry = await search_repo.get_by_target(thread.id, "discussion_thread")
    assert entry is not None
    assert "Chess new" in entry.content


@pytest.mark.asyncio
async def test_index_removed_on_delete(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    search_repo = SearchIndexRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    state_service = ThreadStateService(session, thread_repo, event_bus)

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Chess delete",
            content="Chess delete",
            thread_type="note",
        )
    )
    await state_service.delete_thread(thread.id)

    entry = await search_repo.get_by_target(thread.id, "discussion_thread")
    assert entry is None


@pytest.mark.asyncio
async def test_search_uses_tsvector_on_postgres(session):
    search_repo = SearchIndexRepository(session)
    if session.bind.dialect.name != "postgresql":
        pytest.skip("Postgres-specific search_vector check")
    entry = await search_repo.upsert(
        entry_id="entry-1",
        target_id="target-1",
        target_type="discussion_thread",
        content="Chess content",
        author_id="user-1",
    )
    assert entry.search_vector is not None
