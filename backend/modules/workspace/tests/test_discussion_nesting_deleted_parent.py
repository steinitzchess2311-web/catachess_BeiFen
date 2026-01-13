"""
Discussion nesting deleted parent test.
"""

import pytest

from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.domain.models.discussion_reply import AddReplyCommand, DeleteReplyCommand
from modules.workspace.domain.models.discussion_thread import CreateThreadCommand
from modules.workspace.domain.services.discussion.reply_service import ReplyService
from modules.workspace.domain.services.discussion.thread_service import ThreadService


@pytest.mark.asyncio
async def test_nested_depth_with_deleted_parents(session, event_bus):
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
    await reply_service.delete_reply(
        DeleteReplyCommand(reply_id=reply.id, actor_id="user-1")
    )
    with pytest.raises(ValueError):
        await reply_service.add_reply(
            AddReplyCommand(
                thread_id=thread.id,
                author_id="user-1",
                content="B",
                parent_reply_id=reply.id,
            )
        )
