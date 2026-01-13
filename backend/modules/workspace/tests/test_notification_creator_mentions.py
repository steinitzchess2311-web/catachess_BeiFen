"""Notification creator mention tests."""
from types import SimpleNamespace

import pytest

from modules.workspace.db.repos.discussion_reaction_repo import DiscussionReactionRepository
from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.notification_repo import NotificationRepository
from modules.workspace.events.subscribers.notification_creator import NotificationCreator
from modules.workspace.events.types import EventType


def _event(payload: dict):
    return SimpleNamespace(
        type=EventType.DISCUSSION_MENTION,
        actor_id="actor",
        target_id="target",
        target_type="discussion_thread",
        payload=payload,
    )


@pytest.mark.asyncio
async def test_mention_creates_notification(session):
    creator = NotificationCreator(
        NotificationRepository(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        DiscussionReactionRepository(session),
    )
    await creator.handle_event(_event({"mentioned_user_id": "u1"}))
    items = await NotificationRepository(session).list_by_user("u1")
    assert len(items) == 1


@pytest.mark.asyncio
async def test_mention_missing_user_id_skipped(session):
    creator = NotificationCreator(
        NotificationRepository(session),
        DiscussionThreadRepository(session),
        DiscussionReplyRepository(session),
        DiscussionReactionRepository(session),
    )
    await creator.handle_event(_event({}))
    items = await NotificationRepository(session).list_by_user("u1")
    assert items == []
