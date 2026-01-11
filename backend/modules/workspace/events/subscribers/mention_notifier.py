from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.user_repo import UserRepository
from workspace.domain.models.event import CreateEventCommand
from workspace.domain.services.discussion_mentions import extract_mentions
from workspace.events.bus import EventBus
from workspace.events.types import EventType


class MentionNotifier:
    def __init__(
        self,
        event_bus: EventBus,
        thread_repo: DiscussionThreadRepository,
        reply_repo: DiscussionReplyRepository,
        user_repo: UserRepository,
    ) -> None:
        self.event_bus = event_bus
        self.thread_repo = thread_repo
        self.reply_repo = reply_repo
        self.user_repo = user_repo

    async def handle_event(self, event) -> None:
        if event.type in {
            EventType.DISCUSSION_THREAD_CREATED,
            EventType.DISCUSSION_THREAD_UPDATED,
        }:
            await self._emit_mentions_for_thread(event.target_id, event.actor_id)
        if event.type in {
            EventType.DISCUSSION_REPLY_ADDED,
            EventType.DISCUSSION_REPLY_EDITED,
        }:
            await self._emit_mentions_for_reply(event.target_id, event.actor_id)

    async def _emit_mentions_for_thread(self, thread_id: str, actor_id: str) -> None:
        thread = await self.thread_repo.get_by_id(thread_id)
        if not thread:
            return
        await self._emit_mentions(thread.content, actor_id, thread.id, "discussion_thread")

    async def _emit_mentions_for_reply(self, reply_id: str, actor_id: str) -> None:
        reply = await self.reply_repo.get_by_id(reply_id)
        if not reply:
            return
        await self._emit_mentions(reply.content, actor_id, reply.id, "discussion_reply")

    async def _emit_mentions(
        self, content: str, actor_id: str, target_id: str, target_type: str
    ) -> None:
        for mention in extract_mentions(content):
            user = await self.user_repo.get_by_username(mention)
            if not user:
                continue
            command = CreateEventCommand(
                type=EventType.DISCUSSION_MENTION,
                actor_id=actor_id,
                target_id=target_id,
                target_type=target_type,
                version=1,
                payload={"mentioned_user": mention, "mentioned_user_id": user.id},
            )
            await self.event_bus.publish(command)
