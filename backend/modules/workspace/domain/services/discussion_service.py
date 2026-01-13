"""
Discussion service facade.
"""

from modules.workspace.db.repos.discussion_reaction_repo import DiscussionReactionRepository
from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.domain.models.discussion_reaction import AddReactionCommand, RemoveReactionCommand
from modules.workspace.domain.models.discussion_reply import AddReplyCommand, EditReplyCommand, DeleteReplyCommand
from modules.workspace.domain.models.discussion_thread import (
    CreateThreadCommand,
    UpdateThreadCommand,
    ResolveThreadCommand,
    PinThreadCommand,
)
from modules.workspace.domain.services.discussion.reaction_service import ReactionService
from modules.workspace.domain.services.discussion.reply_service import ReplyService
from modules.workspace.domain.services.discussion.thread_service import ThreadService
from modules.workspace.domain.services.discussion.thread_state_service import ThreadStateService
from modules.workspace.events.bus import EventBus
from sqlalchemy.ext.asyncio import AsyncSession


class DiscussionService:
    """Facade for discussion thread/reply/reaction services."""

    def __init__(
        self,
        session: AsyncSession,
        thread_repo: DiscussionThreadRepository,
        reply_repo: DiscussionReplyRepository,
        reaction_repo: DiscussionReactionRepository,
        event_bus: EventBus,
    ) -> None:
        self.thread_service = ThreadService(session, thread_repo, event_bus)
        self.thread_state_service = ThreadStateService(session, thread_repo, event_bus)
        self.reply_service = ReplyService(session, reply_repo, thread_repo, event_bus)
        self.reaction_service = ReactionService(
            session, reaction_repo, thread_repo, reply_repo, event_bus
        )

    async def create_thread(self, command: CreateThreadCommand):
        return await self.thread_service.create_thread(command)

    async def update_thread(self, command: UpdateThreadCommand):
        return await self.thread_service.update_thread(command)

    async def resolve_thread(self, command: ResolveThreadCommand):
        return await self.thread_state_service.resolve_thread(command)

    async def pin_thread(self, command: PinThreadCommand):
        return await self.thread_state_service.pin_thread(command)

    async def delete_thread(self, thread_id: str):
        await self.thread_state_service.delete_thread(thread_id)

    async def add_reply(self, command: AddReplyCommand):
        return await self.reply_service.add_reply(command)

    async def edit_reply(self, command: EditReplyCommand):
        return await self.reply_service.edit_reply(command)

    async def delete_reply(self, command: DeleteReplyCommand):
        await self.reply_service.delete_reply(command)

    async def add_reaction(self, command: AddReactionCommand):
        return await self.reaction_service.add_reaction(command)

    async def remove_reaction(self, command: RemoveReactionCommand):
        await self.reaction_service.remove_reaction(command)
