"""
Search index subscriber for all searchable content.

Indexes:
- Discussion threads and replies
- Studies (node title + description)
- Chapters (title, white, black, event metadata)
- Move annotations (analytical text)
"""

from ulid import ULID

from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.node_repo import NodeRepository
from workspace.db.repos.search_index_repo import SearchIndexRepository
from workspace.db.repos.study_repo import StudyRepository
from workspace.db.repos.variation_repo import VariationRepository
from workspace.events.types import EventType


class SearchIndexer:
    """Update search index from content events."""

    def __init__(
        self,
        thread_repo: DiscussionThreadRepository,
        reply_repo: DiscussionReplyRepository,
        node_repo: NodeRepository,
        study_repo: StudyRepository,
        variation_repo: VariationRepository,
        search_repo: SearchIndexRepository,
    ) -> None:
        self.thread_repo = thread_repo
        self.reply_repo = reply_repo
        self.node_repo = node_repo
        self.study_repo = study_repo
        self.variation_repo = variation_repo
        self.search_repo = search_repo

    async def handle_event(self, event) -> None:
        # Discussion events
        if event.type in {
            EventType.DISCUSSION_THREAD_CREATED,
            EventType.DISCUSSION_THREAD_UPDATED,
        }:
            await self._index_thread(event.target_id)
        if event.type == EventType.DISCUSSION_THREAD_DELETED:
            await self._delete_entry(event.target_id, "discussion_thread")
        if event.type in {
            EventType.DISCUSSION_REPLY_ADDED,
            EventType.DISCUSSION_REPLY_EDITED,
        }:
            await self._index_reply(event.target_id)
        if event.type == EventType.DISCUSSION_REPLY_DELETED:
            await self._delete_entry(event.target_id, "discussion_reply")

        # Study events
        if event.type in {
            EventType.STUDY_CREATED,
            EventType.STUDY_UPDATED,
        }:
            await self._index_study(event.target_id)
        if event.type == EventType.STUDY_DELETED:
            await self._delete_entry(event.target_id, "study")

        # Chapter events
        if event.type in {
            EventType.STUDY_CHAPTER_CREATED,
            EventType.STUDY_CHAPTER_RENAMED,
        }:
            await self._index_chapter(event.target_id)
        if event.type == EventType.STUDY_CHAPTER_DELETED:
            await self._delete_entry(event.target_id, "chapter")

        # Move annotation events
        if event.type in {
            EventType.STUDY_MOVE_ANNOTATION_ADDED,
            EventType.STUDY_MOVE_ANNOTATION_UPDATED,
        }:
            await self._index_annotation(event.target_id)
        if event.type == EventType.STUDY_MOVE_ANNOTATION_DELETED:
            await self._delete_entry(event.target_id, "move_annotation")

    async def _index_thread(self, thread_id: str) -> None:
        thread = await self.thread_repo.get_by_id(thread_id)
        if not thread:
            return
        content = f"{thread.title}\n{thread.content}"
        await self.search_repo.upsert(
            entry_id=str(ULID()),
            target_id=thread.id,
            target_type="discussion_thread",
            content=content,
            author_id=thread.author_id,
        )

    async def _index_reply(self, reply_id: str) -> None:
        reply = await self.reply_repo.get_by_id(reply_id)
        if not reply:
            return
        await self.search_repo.upsert(
            entry_id=str(ULID()),
            target_id=reply.id,
            target_type="discussion_reply",
            content=reply.content,
            author_id=reply.author_id,
        )

    async def _delete_entry(self, target_id: str, target_type: str) -> None:
        await self.search_repo.delete_by_target(target_id, target_type)


def register_search_indexer(
    bus,
    thread_repo: DiscussionThreadRepository,
    reply_repo: DiscussionReplyRepository,
    search_repo: SearchIndexRepository,
) -> SearchIndexer:
    """Register the search indexer subscriber on the bus."""
    indexer = SearchIndexer(thread_repo, reply_repo, search_repo)
    bus.subscribe(indexer.handle_event)
    return indexer
