"""
Discussion reaction uniqueness tests.
"""

import pytest

from workspace.db.repos.discussion_reaction_repo import DiscussionReactionRepository
from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.domain.models.discussion_reaction import (
    AddReactionCommand,
    RemoveReactionCommand,
)
from workspace.domain.models.discussion_thread import CreateThreadCommand
from workspace.domain.services.discussion.reaction_service import ReactionService
from workspace.domain.services.discussion.thread_service import ThreadService


@pytest.mark.asyncio
async def test_duplicate_reaction_rejected(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    reaction_repo = DiscussionReactionRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reaction_service = ReactionService(
        session, reaction_repo, thread_repo, reply_repo, event_bus
    )

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-1",
            target_type="study",
            author_id="user-1",
            title="Dup",
            content="Root",
            thread_type="note",
        )
    )
    await reaction_service.add_reaction(
        AddReactionCommand(
            target_id=thread.id,
            target_type="thread",
            user_id="user-2",
            emoji="👍",
        )
    )
    with pytest.raises(ValueError):
        await reaction_service.add_reaction(
            AddReactionCommand(
                target_id=thread.id,
                target_type="thread",
                user_id="user-2",
                emoji="❤️",
            )
        )


@pytest.mark.asyncio
async def test_user_can_change_reaction(session, event_bus):
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    reaction_repo = DiscussionReactionRepository(session)
    thread_service = ThreadService(session, thread_repo, event_bus)
    reaction_service = ReactionService(
        session, reaction_repo, thread_repo, reply_repo, event_bus
    )

    thread = await thread_service.create_thread(
        CreateThreadCommand(
            target_id="study-2",
            target_type="study",
            author_id="user-1",
            title="Change",
            content="Root",
            thread_type="note",
        )
    )
    reaction = await reaction_service.add_reaction(
        AddReactionCommand(
            target_id=thread.id,
            target_type="thread",
            user_id="user-2",
            emoji="👍",
        )
    )
    await reaction_service.remove_reaction(
        RemoveReactionCommand(reaction_id=reaction.id, user_id="user-2")
    )
    new_reaction = await reaction_service.add_reaction(
        AddReactionCommand(
            target_id=thread.id,
            target_type="thread",
            user_id="user-2",
            emoji="❤️",
        )
    )
    assert new_reaction.emoji == "❤️"
