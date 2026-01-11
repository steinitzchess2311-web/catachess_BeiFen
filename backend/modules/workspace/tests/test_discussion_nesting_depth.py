"""
Discussion nesting depth tests.
"""

import pytest

from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.domain.models.discussion_reply import AddReplyCommand
from workspace.domain.models.discussion_thread import CreateThreadCommand
from workspace.domain.services.discussion.nesting import (
    NestingDepthExceededError,
    can_add_reply,
    get_reply_depth,
)
from workspace.domain.services.discussion.reply_service import ReplyService
from workspace.domain.services.discussion.thread_service import ThreadService


@pytest.mark.asyncio
async def test_get_reply_depth_correct(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Depth",
            content="Root",
            thread_type="note",
        )
    )
    reply = await reply_service.add_reply(
        AddReplyCommand(thread_id=thread.id, author_id="user-1", content="A")
    )
    child = await reply_service.add_reply(
        AddReplyCommand(
            thread_id=thread.id,
            author_id="user-1",
            content="B",
            parent_reply_id=reply.id,
        )
    )
    assert await get_reply_depth(reply_repo, reply.id) == 1
    assert await get_reply_depth(reply_repo, child.id) == 2


@pytest.mark.asyncio
async def test_configure_max_depth(monkeypatch, session, event_bus):
    monkeypatch.setenv("DISCUSSION_MAX_REPLY_DEPTH", "2")
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Depth",
            content="Root",
            thread_type="note",
        )
    )
    reply = await reply_service.add_reply(
        AddReplyCommand(thread_id=thread.id, author_id="user-1", content="A")
    )
    assert await can_add_reply(reply_repo, reply.id) is True
    child = await reply_service.add_reply(
        AddReplyCommand(
            thread_id=thread.id,
            author_id="user-1",
            content="B",
            parent_reply_id=reply.id,
        )
    )
    with pytest.raises(NestingDepthExceededError):
        await reply_service.add_reply(
            AddReplyCommand(
                thread_id=thread.id,
                author_id="user-1",
                content="C",
                parent_reply_id=child.id,
            )
        )
