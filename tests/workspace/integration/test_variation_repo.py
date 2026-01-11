"""
Integration tests for VariationRepository.
"""

import pytest
from ulid import ULID

from workspace.db.repos.variation_repo import VariationRepository
from workspace.db.tables.variations import (
    MoveAnnotation,
    Variation,
    VariationPriority,
    VariationVisibility,
)
from workspace.domain.models.node import CreateNodeCommand
from workspace.domain.models.types import NodeType
from workspace.domain.services.node_service import NodeService


@pytest.mark.asyncio
async def test_create_variation(
    session,
    variation_repo: VariationRepository,
    node_service: NodeService,
):
    """Test creating a variation."""
    # Create study and chapter
    workspace = await node_service.create_node(
        CreateNodeCommand(
            node_type=NodeType.WORKSPACE,
            title="Test Workspace",
            owner_id="user123",
        ),
        actor_id="user123",
    )

    study = await node_service.create_node(
        CreateNodeCommand(
            node_type=NodeType.STUDY,
            title="Test Study",
            owner_id="user123",
            parent_id=workspace.id,
        ),
        actor_id="user123",
    )

    chapter_id = str(ULID())

    # Create variation
    variation = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=None,
        next_id=None,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        rank=0,
        created_by="user123",
    )

    created = await variation_repo.create_variation(variation)
    await session.commit()

    assert created.id == variation.id
    assert created.san == "e4"


@pytest.mark.asyncio
async def test_get_variation_by_id(
    session,
    variation_repo: VariationRepository,
):
    """Test retrieving variation by ID."""
    chapter_id = str(ULID())
    variation = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="test_fen",
        created_by="user123",
    )

    await variation_repo.create_variation(variation)
    await session.commit()

    retrieved = await variation_repo.get_variation_by_id(variation.id)

    assert retrieved is not None
    assert retrieved.id == variation.id
    assert retrieved.san == "e4"


@pytest.mark.asyncio
async def test_get_variations_for_chapter(
    session,
    variation_repo: VariationRepository,
):
    """Test getting all variations for a chapter."""
    chapter_id = str(ULID())

    # Create multiple variations
    var1 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user123",
    )

    var2 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=var1.id,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="fen2",
        rank=0,
        created_by="user123",
    )

    await variation_repo.create_variation(var1)
    await variation_repo.create_variation(var2)
    await session.commit()

    variations = await variation_repo.get_variations_for_chapter(chapter_id)

    assert len(variations) == 2


@pytest.mark.asyncio
async def test_get_children(
    session,
    variation_repo: VariationRepository,
):
    """Test getting child variations."""
    chapter_id = str(ULID())

    # Create parent
    parent = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user123",
    )

    # Create children
    child1 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="fen2",
        rank=0,
        created_by="user123",
    )

    child2 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,
        created_by="user123",
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(child1)
    await variation_repo.create_variation(child2)
    await session.commit()

    children = await variation_repo.get_children(parent.id, chapter_id)

    assert len(children) == 2
    # Should be ordered by rank
    assert children[0].rank == 0
    assert children[1].rank == 1


@pytest.mark.asyncio
async def test_reorder_siblings(
    session,
    variation_repo: VariationRepository,
):
    """Test reordering sibling variations."""
    chapter_id = str(ULID())

    parent = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        created_by="user123",
    )

    child1 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="fen2",
        rank=0,
        created_by="user123",
    )

    child2 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,
        created_by="user123",
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(child1)
    await variation_repo.create_variation(child2)
    await session.commit()

    # Reorder: swap child1 and child2
    await variation_repo.reorder_siblings(
        parent.id, chapter_id, [child2.id, child1.id]
    )
    await session.commit()

    # Check new order
    children = await variation_repo.get_children(parent.id, chapter_id)
    assert children[0].id == child2.id
    assert children[0].rank == 0
    assert children[1].id == child1.id
    assert children[1].rank == 1


@pytest.mark.asyncio
async def test_create_annotation(
    session,
    variation_repo: VariationRepository,
):
    """Test creating a move annotation."""
    chapter_id = str(ULID())

    variation = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        created_by="user123",
    )

    await variation_repo.create_variation(variation)

    annotation = MoveAnnotation(
        id=str(ULID()),
        move_id=variation.id,
        nag="!",
        text="Excellent move",
        author_id="user123",
    )

    created = await variation_repo.create_annotation(annotation)
    await session.commit()

    assert created.id == annotation.id
    assert created.nag == "!"
    assert created.text == "Excellent move"


@pytest.mark.asyncio
async def test_get_annotation_for_move(
    session,
    variation_repo: VariationRepository,
):
    """Test getting annotation for a specific move."""
    chapter_id = str(ULID())

    variation = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        created_by="user123",
    )

    await variation_repo.create_variation(variation)

    annotation = MoveAnnotation(
        id=str(ULID()),
        move_id=variation.id,
        nag="?",
        text="Mistake",
        author_id="user123",
    )

    await variation_repo.create_annotation(annotation)
    await session.commit()

    retrieved = await variation_repo.get_annotation_for_move(variation.id)

    assert retrieved is not None
    assert retrieved.nag == "?"
    assert retrieved.text == "Mistake"


@pytest.mark.asyncio
async def test_update_annotation_increments_version(
    session,
    variation_repo: VariationRepository,
):
    """Test that updating annotation increments version."""
    chapter_id = str(ULID())

    variation = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        created_by="user123",
    )

    await variation_repo.create_variation(variation)

    annotation = MoveAnnotation(
        id=str(ULID()),
        move_id=variation.id,
        text="First version",
        author_id="user123",
    )

    created = await variation_repo.create_annotation(annotation)
    await session.commit()

    assert created.version == 1

    # Update
    created.text = "Second version"
    updated = await variation_repo.update_annotation(created)
    await session.commit()

    assert updated.version == 2
    assert updated.text == "Second version"


@pytest.mark.asyncio
async def test_delete_annotation(
    session,
    variation_repo: VariationRepository,
):
    """Test deleting a move annotation."""
    chapter_id = str(ULID())

    variation = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        created_by="user123",
    )

    await variation_repo.create_variation(variation)

    annotation = MoveAnnotation(
        id=str(ULID()),
        move_id=variation.id,
        text="To be deleted",
        author_id="user123",
    )

    await variation_repo.create_annotation(annotation)
    await session.commit()

    # Delete
    await variation_repo.delete_annotation(annotation)
    await session.commit()

    # Should not be found
    retrieved = await variation_repo.get_annotation_by_id(annotation.id)
    assert retrieved is None
