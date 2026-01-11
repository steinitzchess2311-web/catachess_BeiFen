"""
Tests for PGN clip service R2 loading and caching.
"""

import asyncio

import pytest
from botocore.exceptions import ClientError, EndpointConnectionError

from workspace.db.repos.event_repo import EventRepository
from workspace.db.repos.study_repo import StudyRepository
from workspace.db.repos.variation_repo import VariationRepository
from workspace.db.tables.nodes import Node
from workspace.db.tables.studies import Chapter, Study
from workspace.domain.models.types import NodeType, Visibility
from workspace.domain.services.pgn_clip_service import PgnClipService


def _build_entities(node_id: str, chapter_id: str, r2_key: str) -> list:
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
        r2_key=r2_key,
        pgn_hash=None,
        pgn_size=None,
        r2_etag=None,
        last_synced_at=None,
    )
    return [node, study, chapter]


class StubR2Client:
    def __init__(self, pgn_text: str) -> None:
        self.pgn_text = pgn_text
        self.calls: list[str] = []

    def download_pgn(self, key: str) -> str:
        self.calls.append(key)
        return self.pgn_text


class SequenceR2Client:
    def __init__(self, responses: list) -> None:
        self.responses = list(responses)
        self.calls: list[str] = []

    def download_pgn(self, key: str) -> str:
        self.calls.append(key)
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


def _make_service(session, event_bus, r2_client, **kwargs) -> PgnClipService:
    return PgnClipService(
        study_repo=StudyRepository(session),
        variation_repo=VariationRepository(session),
        event_repo=EventRepository(session),
        event_bus=event_bus,
        r2_client=r2_client,
        **kwargs,
    )


@pytest.mark.asyncio
async def test_load_tree_from_r2(session, event_bus):
    session.add_all(_build_entities("study-1", "chapter-1", "r2://chapter-1"))
    await session.flush()

    r2_client = StubR2Client(
        """
[Event "Test Game"]

1. e4 e5 2. Nf3 Nc6 *
"""
    )
    clip_service = _make_service(session, event_bus, r2_client)

    result = await clip_service.clip_from_move(
        chapter_id="chapter-1",
        move_path="main.1",
        actor_id="user-1",
    )

    assert "e4" in result.pgn_text
    assert r2_client.calls == ["r2://chapter-1"]


@pytest.mark.asyncio
async def test_load_tree_r2_not_found(session, event_bus):
    session.add_all(_build_entities("study-1", "chapter-1", "r2://missing"))
    await session.flush()

    error = ClientError({"Error": {"Code": "404"}}, "GetObject")
    r2_client = SequenceR2Client([error])
    clip_service = _make_service(session, event_bus, r2_client)

    with pytest.raises(ValueError):
        await clip_service._load_variation_tree("chapter-1")


@pytest.mark.asyncio
async def test_load_tree_r2_connection_error(session, event_bus):
    session.add_all(_build_entities("study-1", "chapter-1", "r2://unstable"))
    await session.flush()

    error = EndpointConnectionError(endpoint_url="https://r2.example")
    r2_client = SequenceR2Client([error, error, error])
    clip_service = _make_service(session, event_bus, r2_client, max_retries=3, backoff_base_seconds=0)

    with pytest.raises(ValueError):
        await clip_service._load_variation_tree("chapter-1")


@pytest.mark.asyncio
async def test_load_tree_corrupt_pgn(session, event_bus):
    session.add_all(_build_entities("study-1", "chapter-1", "r2://chapter-1"))
    await session.flush()

    r2_client = StubR2Client("not-a-valid-pgn")
    clip_service = _make_service(session, event_bus, r2_client)

    with pytest.raises(ValueError, match="Invalid PGN"):
        await clip_service._load_variation_tree("chapter-1")


@pytest.mark.asyncio
async def test_load_tree_cache_hit(session, event_bus):
    session.add_all(_build_entities("study-1", "chapter-1", "r2://chapter-1"))
    await session.flush()

    r2_client = StubR2Client(
        """
[Event "Test Game"]

1. e4 e5 2. Nf3 Nc6 *
"""
    )
    clip_service = _make_service(session, event_bus, r2_client, cache_ttl_seconds=60)

    first = await clip_service._load_variation_tree("chapter-1")
    second = await clip_service._load_variation_tree("chapter-1")

    assert first is second
    assert r2_client.calls == ["r2://chapter-1"]


@pytest.mark.asyncio
async def test_load_tree_cache_expiry(session, event_bus):
    session.add_all(_build_entities("study-1", "chapter-1", "r2://chapter-1"))
    await session.flush()

    r2_client = StubR2Client(
        """
[Event "Test Game"]

1. e4 e5 2. Nf3 Nc6 *
"""
    )
    clip_service = _make_service(session, event_bus, r2_client, cache_ttl_seconds=0.01)

    await clip_service._load_variation_tree("chapter-1")
    await asyncio.sleep(0.02)
    await clip_service._load_variation_tree("chapter-1")

    assert r2_client.calls == ["r2://chapter-1", "r2://chapter-1"]


@pytest.mark.asyncio
async def test_load_tree_retries_then_succeeds(session, event_bus):
    session.add_all(_build_entities("study-1", "chapter-1", "r2://chapter-1"))
    await session.flush()

    error = EndpointConnectionError(endpoint_url="https://r2.example")
    r2_client = SequenceR2Client(
        [
            error,
            error,
            """
[Event "Test Game"]

1. e4 e5 2. Nf3 Nc6 *
""",
        ]
    )
    clip_service = _make_service(
        session,
        event_bus,
        r2_client,
        max_retries=3,
        backoff_base_seconds=0,
    )

    tree = await clip_service._load_variation_tree("chapter-1")

    assert tree is not None
    assert r2_client.calls == ["r2://chapter-1"] * 3
