"""
Tests for PGN clip service integration.
"""

import pytest

from workspace.db.repos.event_repo import EventRepository
from workspace.db.repos.study_repo import StudyRepository
from workspace.db.repos.variation_repo import VariationRepository
from workspace.db.tables.nodes import Node
from workspace.db.tables.studies import Chapter, Study
from workspace.domain.models.types import NodeType, Visibility
from workspace.domain.services.pgn_clip_service import PgnClipService
from workspace.events.types import EventType


class StubR2Client:
    def __init__(self, pgn_text: str) -> None:
        self.pgn_text = pgn_text
        self.calls: list[str] = []

    def download_pgn(self, key: str) -> str:
        self.calls.append(key)
        return self.pgn_text


@pytest.mark.asyncio
async def test_clip_service_emits_event(session, event_bus):
    node_id = "study-1"
    chapter_id = "chapter-1"

    node = Node(
        id=node_id,
        node_type=NodeType.STUDY,
        title="Test Study",
        description=None,
        owner_id="user-1",
        visibility=Visibility.PRIVATE,
        parent_id=None,
        path=f"/{node_id}/",
        depth=0,
        layout={},
        version=1,
    )
    study = Study(
        id=node_id,
        description=None,
        chapter_count=1,
        is_public=False,
        tags=None,
    )
    chapter = Chapter(
        id=chapter_id,
        study_id=node_id,
        title="Chapter 1",
        order=0,
        white=None,
        black=None,
        event=None,
        date=None,
        result=None,
        r2_key="r2://chapter-1",
        pgn_hash=None,
        pgn_size=None,
        r2_etag=None,
        last_synced_at=None,
    )

    session.add_all([node, study, chapter])
    await session.flush()

    r2_client = StubR2Client(
        """
[Event "Test Game"]

1. e4 e5 2. Nf3 Nc6 *
"""
    )

    clip_service = PgnClipService(
        study_repo=StudyRepository(session),
        variation_repo=VariationRepository(session),
        event_repo=EventRepository(session),
        event_bus=event_bus,
        r2_client=r2_client,
    )

    result = await clip_service.clip_from_move(
        chapter_id=chapter_id,
        move_path="main.1",
        actor_id="user-1",
    )

    assert "e4" in result.pgn_text
    assert r2_client.calls == ["r2://chapter-1"]

    event_repo = EventRepository(session)
    events = await event_repo.get_events_for_target(chapter_id)
    assert len(events) == 1
    assert events[0].type == EventType.PGN_CLIPBOARD_GENERATED
