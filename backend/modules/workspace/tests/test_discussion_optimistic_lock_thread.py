"""
Discussion thread optimistic locking tests.
"""

import pytest

from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.domain.models.discussion_thread import CreateThreadCommand, UpdateThreadCommand
from modules.workspace.domain.services.discussion.thread_service import OptimisticLockError, ThreadService


@pytest.mark.asyncio
async def test_concurrent_thread_edit_conflict(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    service = ThreadService(session, thread_repo, event_bus)
    thread = await service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="T",
            content="Root",
            thread_type="note",
        )
    )
    with pytest.raises(OptimisticLockError):
        await service.update_thread(
            UpdateThreadCommand(
                thread_id=thread.id,
                title="Bad",
                content="Bad",
                actor_id="user-1",
                version=thread.version + 1,
            )
        )


@pytest.mark.asyncio
async def test_thread_edit_increments_version(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    service = ThreadService(session, thread_repo, event_bus)
    thread = await service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="T",
            content="Root",
            thread_type="note",
        )
    )
    updated = await service.update_thread(
        UpdateThreadCommand(
            thread_id=thread.id,
            title="New",
            content="New",
            actor_id="user-1",
            version=thread.version,
        )
    )
    assert updated.version == thread.version + 1
