"""
Integration tests for StudyService.
"""

import pytest
from ulid import ULID

from workspace.db.repos.variation_repo import VariationRepository
from workspace.db.tables.variations import Variation
from workspace.domain.models.variation import (
    AddMoveCommand,
    DeleteMoveCommand,
)
from workspace.domain.models.move_annotation import (
    AddMoveAnnotationCommand,
    UpdateMoveAnnotationCommand,
    SetNAGCommand,
)
from workspace.domain.services.study_service import (
    StudyService,
    MoveNotFoundError,
    AnnotationNotFoundError,
    AnnotationAlreadyExistsError,
    OptimisticLockError,
)
from workspace.events.bus import EventBus


@pytest.mark.asyncio
async def test_add_move_annotation_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test adding annotation to a move."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(move)
    await session.commit()

    # Add annotation
    service = StudyService(session, variation_repo, event_bus)
    command = AddMoveAnnotationCommand(
        move_id=move.id,
        author_id="user1",
        nag="!",
        text="Excellent opening move",
    )

    annotation = await service.add_move_annotation(command)

    # Verify annotation created
    assert annotation.id is not None
    assert annotation.move_id == move.id
    assert annotation.nag == "!"
    assert annotation.text == "Excellent opening move"
    assert annotation.author_id == "user1"
    assert annotation.version == 1


@pytest.mark.asyncio
async def test_add_move_annotation_move_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test adding annotation to non-existent move."""
    service = StudyService(session, variation_repo, event_bus)
    command = AddMoveAnnotationCommand(
        move_id="non_existent",
        author_id="user1",
        nag="!",
    )

    with pytest.raises(MoveNotFoundError):
        await service.add_move_annotation(command)


@pytest.mark.asyncio
async def test_add_move_annotation_already_exists(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test adding annotation when one already exists."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(move)
    await session.commit()

    # Add first annotation
    service = StudyService(session, variation_repo, event_bus)
    command1 = AddMoveAnnotationCommand(
        move_id=move.id,
        author_id="user1",
        nag="!",
    )
    await service.add_move_annotation(command1)

    # Try to add second annotation
    command2 = AddMoveAnnotationCommand(
        move_id=move.id,
        author_id="user1",
        nag="?",
    )

    with pytest.raises(AnnotationAlreadyExistsError):
        await service.add_move_annotation(command2)


@pytest.mark.asyncio
async def test_edit_move_annotation_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test editing an existing annotation."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(move)
    await session.commit()

    # Add annotation
    service = StudyService(session, variation_repo, event_bus)
    command_add = AddMoveAnnotationCommand(
        move_id=move.id,
        author_id="user1",
        nag="!",
        text="Good move",
    )
    annotation = await service.add_move_annotation(command_add)

    # Edit annotation
    command_edit = UpdateMoveAnnotationCommand(
        annotation_id=annotation.id,
        version=1,
        actor_id="user1",
        nag="!!",
        text="Brilliant move",
    )
    updated = await service.edit_move_annotation(command_edit)

    # Verify changes
    assert updated.id == annotation.id
    assert updated.nag == "!!"
    assert updated.text == "Brilliant move"
    assert updated.version == 2  # Incremented


@pytest.mark.asyncio
async def test_edit_move_annotation_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test editing non-existent annotation."""
    service = StudyService(session, variation_repo, event_bus)
    command = UpdateMoveAnnotationCommand(
        annotation_id="non_existent",
        version=1,
        actor_id="user1",
        nag="!",
    )

    with pytest.raises(AnnotationNotFoundError):
        await service.edit_move_annotation(command)


@pytest.mark.asyncio
async def test_edit_move_annotation_version_conflict(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test editing annotation with wrong version."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(move)
    await session.commit()

    # Add annotation
    service = StudyService(session, variation_repo, event_bus)
    command_add = AddMoveAnnotationCommand(
        move_id=move.id,
        author_id="user1",
        nag="!",
    )
    annotation = await service.add_move_annotation(command_add)

    # Try to edit with wrong version
    command_edit = UpdateMoveAnnotationCommand(
        annotation_id=annotation.id,
        version=5,  # Wrong version
        actor_id="user1",
        nag="?",
    )

    with pytest.raises(OptimisticLockError, match="Version conflict"):
        await service.edit_move_annotation(command_edit)


@pytest.mark.asyncio
async def test_delete_move_annotation_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test deleting an annotation."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(move)
    await session.commit()

    # Add annotation
    service = StudyService(session, variation_repo, event_bus)
    command_add = AddMoveAnnotationCommand(
        move_id=move.id,
        author_id="user1",
        nag="!",
    )
    annotation = await service.add_move_annotation(command_add)

    # Delete annotation
    await service.delete_move_annotation(annotation.id, "user1")

    # Verify deleted
    deleted = await variation_repo.get_annotation_by_id(annotation.id)
    assert deleted is None


@pytest.mark.asyncio
async def test_delete_move_annotation_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test deleting non-existent annotation."""
    service = StudyService(session, variation_repo, event_bus)

    with pytest.raises(AnnotationNotFoundError):
        await service.delete_move_annotation("non_existent", "user1")


@pytest.mark.asyncio
async def test_set_nag_creates_new_annotation(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test setting NAG creates new annotation if none exists."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(move)
    await session.commit()

    # Set NAG
    service = StudyService(session, variation_repo, event_bus)
    command = SetNAGCommand(
        move_id=move.id,
        nag="!",
        actor_id="user1",
    )
    annotation = await service.set_nag(command)

    # Verify annotation created
    assert annotation.id is not None
    assert annotation.move_id == move.id
    assert annotation.nag == "!"
    assert annotation.text is None
    assert annotation.version == 1


@pytest.mark.asyncio
async def test_set_nag_updates_existing_annotation(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test setting NAG updates existing annotation."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(move)
    await session.commit()

    # Add annotation with text
    service = StudyService(session, variation_repo, event_bus)
    command_add = AddMoveAnnotationCommand(
        move_id=move.id,
        author_id="user1",
        text="Good move",
    )
    annotation = await service.add_move_annotation(command_add)

    # Set NAG (should update existing)
    command_nag = SetNAGCommand(
        move_id=move.id,
        nag="!",
        actor_id="user1",
    )
    updated = await service.set_nag(command_nag)

    # Verify updated
    assert updated.id == annotation.id
    assert updated.nag == "!"
    assert updated.text == "Good move"  # Preserved
    assert updated.version == 2  # Incremented


@pytest.mark.asyncio
async def test_set_nag_move_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test setting NAG for non-existent move."""
    service = StudyService(session, variation_repo, event_bus)
    command = SetNAGCommand(
        move_id="non_existent",
        nag="!",
        actor_id="user1",
    )

    with pytest.raises(MoveNotFoundError):
        await service.set_nag(command)


@pytest.mark.asyncio
async def test_add_move_to_root(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test adding first move (root) to chapter."""
    chapter_id = str(ULID())

    # Add first move
    service = StudyService(session, variation_repo, event_bus)
    command = AddMoveCommand(
        chapter_id=chapter_id,
        parent_id=None,
        san="e4",
        uci="e2e4",
        fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        move_number=1,
        color="white",
        created_by="user1",
    )
    move = await service.add_move(command)

    # Verify move created
    assert move.id is not None
    assert move.chapter_id == chapter_id
    assert move.parent_id is None
    assert move.san == "e4"
    assert move.rank == 0
    assert move.version == 1


@pytest.mark.asyncio
async def test_add_move_with_parent(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test adding move with parent."""
    chapter_id = str(ULID())

    # Create parent move
    parent = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )
    await variation_repo.create_variation(parent)
    await session.commit()

    # Add child move
    service = StudyService(session, variation_repo, event_bus)
    command = AddMoveCommand(
        chapter_id=chapter_id,
        parent_id=parent.id,
        san="e5",
        uci="e7e5",
        fen="fen2",
        move_number=1,
        color="black",
        created_by="user1",
    )
    move = await service.add_move(command)

    # Verify move created with parent link
    assert move.id is not None
    assert move.parent_id == parent.id
    assert move.san == "e5"
    assert move.version == 1


@pytest.mark.asyncio
async def test_add_move_parent_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test adding move with non-existent parent."""
    chapter_id = str(ULID())

    service = StudyService(session, variation_repo, event_bus)
    command = AddMoveCommand(
        chapter_id=chapter_id,
        parent_id="non_existent",
        san="e5",
        uci="e7e5",
        fen="fen2",
        move_number=1,
        color="black",
        created_by="user1",
    )

    with pytest.raises(MoveNotFoundError):
        await service.add_move(command)


@pytest.mark.asyncio
async def test_add_variation_move(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test adding alternative variation move."""
    chapter_id = str(ULID())

    # Create parent move
    parent = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )
    await variation_repo.create_variation(parent)
    await session.commit()

    # Add main line move
    service = StudyService(session, variation_repo, event_bus)
    command_main = AddMoveCommand(
        chapter_id=chapter_id,
        parent_id=parent.id,
        san="e5",
        uci="e7e5",
        fen="fen2",
        move_number=1,
        color="black",
        created_by="user1",
        rank=0,
    )
    await service.add_move(command_main)

    # Add alternative variation
    command_alt = AddMoveCommand(
        chapter_id=chapter_id,
        parent_id=parent.id,
        san="c5",
        uci="c7c5",
        fen="fen3",
        move_number=1,
        color="black",
        created_by="user1",
        rank=1,  # Alternative
    )
    alt_move = await service.add_move(command_alt)

    # Verify alternative created
    assert alt_move.id is not None
    assert alt_move.parent_id == parent.id
    assert alt_move.san == "c5"
    assert alt_move.rank == 1


@pytest.mark.asyncio
async def test_delete_move_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test deleting a move."""
    chapter_id = str(ULID())

    # Create a move
    move = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )
    await variation_repo.create_variation(move)
    await session.commit()

    # Delete move
    service = StudyService(session, variation_repo, event_bus)
    command = DeleteMoveCommand(
        variation_id=move.id,
        actor_id="user1",
    )
    await service.delete_move(command)

    # Verify deleted
    deleted = await variation_repo.get_variation_by_id(move.id)
    assert deleted is None


@pytest.mark.asyncio
async def test_delete_move_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test deleting non-existent move."""
    service = StudyService(session, variation_repo, event_bus)
    command = DeleteMoveCommand(
        variation_id="non_existent",
        actor_id="user1",
    )

    with pytest.raises(MoveNotFoundError):
        await service.delete_move(command)


@pytest.mark.asyncio
async def test_delete_move_cascades_to_children(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test that deleting a move also deletes its children."""
    chapter_id = str(ULID())

    # Create parent move
    parent = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,
        created_by="user1",
        version=1,
    )

    # Create child move
    child = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="fen2",
        rank=0,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(child)
    await session.commit()

    # Delete parent
    service = StudyService(session, variation_repo, event_bus)
    command = DeleteMoveCommand(
        variation_id=parent.id,
        actor_id="user1",
    )
    await service.delete_move(command)

    # Verify both deleted (cascade)
    deleted_parent = await variation_repo.get_variation_by_id(parent.id)
    deleted_child = await variation_repo.get_variation_by_id(child.id)
    assert deleted_parent is None
    assert deleted_child is None
