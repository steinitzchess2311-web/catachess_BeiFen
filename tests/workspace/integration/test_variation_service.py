"""
Integration tests for VariationService.
"""

import pytest
from ulid import ULID

from workspace.db.repos.variation_repo import VariationRepository
from workspace.db.tables.variations import Variation
from workspace.domain.models.variation import (
    PromoteVariationCommand,
    DemoteVariationCommand,
    ReorderVariationsCommand,
)
from workspace.domain.services.variation_service import (
    VariationService,
    VariationNotFoundError,
    InvalidOperationError,
    OptimisticLockError,
)
from workspace.events.bus import EventBus


@pytest.mark.asyncio
async def test_promote_variation_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test promoting a variation to main line."""
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
    )

    # Create main line child (e5)
    main_line = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="fen2",
        rank=0,  # Main line
        created_by="user1",
    )

    # Create alternative child (c5)
    alternative = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,  # Alternative
        created_by="user1",
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(main_line)
    await variation_repo.create_variation(alternative)
    await session.commit()

    # Promote alternative to main line
    service = VariationService(session, variation_repo, event_bus)
    command = PromoteVariationCommand(
        variation_id=alternative.id,
        actor_id="user1",
    )

    await service.promote_variation(command)

    # Verify ranks were swapped
    promoted = await variation_repo.get_variation_by_id(alternative.id)
    demoted = await variation_repo.get_variation_by_id(main_line.id)

    assert promoted.rank == 0  # Now main line
    assert demoted.rank == 1  # Now alternative


@pytest.mark.asyncio
async def test_promote_variation_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test promoting non-existent variation."""
    service = VariationService(session, variation_repo, event_bus)
    command = PromoteVariationCommand(
        variation_id="non_existent",
        actor_id="user1",
    )

    with pytest.raises(VariationNotFoundError):
        await service.promote_variation(command)


@pytest.mark.asyncio
async def test_promote_variation_already_main_line(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test promoting variation that is already main line."""
    chapter_id = str(ULID())

    # Create main line variation
    main_line = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,  # Already main line
        created_by="user1",
    )

    await variation_repo.create_variation(main_line)
    await session.commit()

    service = VariationService(session, variation_repo, event_bus)
    command = PromoteVariationCommand(
        variation_id=main_line.id,
        actor_id="user1",
    )

    with pytest.raises(InvalidOperationError, match="already main line"):
        await service.promote_variation(command)


@pytest.mark.asyncio
async def test_demote_variation_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test demoting main line to alternative."""
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
    )

    # Create main line child (e5)
    main_line = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="fen2",
        rank=0,  # Main line
        created_by="user1",
    )

    # Create alternative child (c5)
    alternative = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,  # Alternative
        created_by="user1",
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(main_line)
    await variation_repo.create_variation(alternative)
    await session.commit()

    # Demote main line to rank 1
    service = VariationService(session, variation_repo, event_bus)
    command = DemoteVariationCommand(
        variation_id=main_line.id,
        target_rank=1,
        actor_id="user1",
    )

    await service.demote_variation(command)

    # Verify ranks were swapped
    demoted = await variation_repo.get_variation_by_id(main_line.id)
    promoted = await variation_repo.get_variation_by_id(alternative.id)

    assert demoted.rank == 1  # Now alternative
    assert promoted.rank == 0  # Now main line


@pytest.mark.asyncio
async def test_demote_variation_not_main_line(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test demoting variation that is not main line."""
    chapter_id = str(ULID())

    # Create alternative variation
    alternative = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=1,  # Not main line
        created_by="user1",
    )

    await variation_repo.create_variation(alternative)
    await session.commit()

    service = VariationService(session, variation_repo, event_bus)
    command = DemoteVariationCommand(
        variation_id=alternative.id,
        target_rank=2,
        actor_id="user1",
    )

    with pytest.raises(InvalidOperationError, match="not main line"):
        await service.demote_variation(command)


@pytest.mark.asyncio
async def test_demote_variation_invalid_rank(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test demoting to invalid target rank."""
    chapter_id = str(ULID())

    # Create main line variation
    main_line = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,  # Main line
        created_by="user1",
    )

    await variation_repo.create_variation(main_line)
    await session.commit()

    service = VariationService(session, variation_repo, event_bus)
    command = DemoteVariationCommand(
        variation_id=main_line.id,
        target_rank=0,  # Invalid: must be > 0
        actor_id="user1",
    )

    with pytest.raises(InvalidOperationError, match="greater than 0"):
        await service.demote_variation(command)


@pytest.mark.asyncio
async def test_demote_variation_target_not_found(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test demoting when target rank doesn't exist."""
    chapter_id = str(ULID())

    # Create main line variation (only child)
    main_line = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="fen1",
        rank=0,  # Main line
        created_by="user1",
    )

    await variation_repo.create_variation(main_line)
    await session.commit()

    service = VariationService(session, variation_repo, event_bus)
    command = DemoteVariationCommand(
        variation_id=main_line.id,
        target_rank=5,  # No variation at rank 5
        actor_id="user1",
    )

    with pytest.raises(InvalidOperationError, match="No variation found at rank"):
        await service.demote_variation(command)


@pytest.mark.asyncio
async def test_reorder_siblings_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test successfully reordering sibling variations."""
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
    )

    # Create three sibling variations
    child1 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="fen2",
        rank=0,  # Main line
        created_by="user1",
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
        rank=1,  # First alternative
        created_by="user1",
    )

    child3 = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="d5",
        uci="d7d5",
        fen="fen4",
        rank=2,  # Second alternative
        created_by="user1",
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(child1)
    await variation_repo.create_variation(child2)
    await variation_repo.create_variation(child3)
    await session.commit()

    # Reorder: child3, child1, child2
    service = VariationService(session, variation_repo, event_bus)
    command = ReorderVariationsCommand(
        parent_id=parent.id,
        chapter_id=chapter_id,
        new_order=[child3.id, child1.id, child2.id],
        actor_id="user1",
    )

    await service.reorder_siblings(command)

    # Verify new ranks
    updated1 = await variation_repo.get_variation_by_id(child1.id)
    updated2 = await variation_repo.get_variation_by_id(child2.id)
    updated3 = await variation_repo.get_variation_by_id(child3.id)

    assert updated3.rank == 0  # Now main line
    assert updated1.rank == 1  # Now first alternative
    assert updated2.rank == 2  # Now second alternative


@pytest.mark.asyncio
async def test_reorder_siblings_invalid_id(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test reordering with invalid variation ID."""
    chapter_id = str(ULID())

    # Create parent and one child
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
    )

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
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(child)
    await session.commit()

    # Try to reorder with non-existent ID
    service = VariationService(session, variation_repo, event_bus)
    command = ReorderVariationsCommand(
        parent_id=parent.id,
        chapter_id=chapter_id,
        new_order=[child.id, "non_existent_id"],
        actor_id="user1",
    )

    with pytest.raises(InvalidOperationError, match="must be siblings"):
        await service.reorder_siblings(command)


@pytest.mark.asyncio
async def test_reorder_siblings_incomplete(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test reordering with incomplete sibling list."""
    chapter_id = str(ULID())

    # Create parent and two children
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
        created_by="user1",
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
        created_by="user1",
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(child1)
    await variation_repo.create_variation(child2)
    await session.commit()

    # Try to reorder with only one child (missing child2)
    service = VariationService(session, variation_repo, event_bus)
    command = ReorderVariationsCommand(
        parent_id=parent.id,
        chapter_id=chapter_id,
        new_order=[child1.id],  # Missing child2
        actor_id="user1",
    )

    with pytest.raises(InvalidOperationError, match="must contain all"):
        await service.reorder_siblings(command)


@pytest.mark.asyncio
async def test_promote_variation_optimistic_lock_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test promoting with correct version (optimistic lock success)."""
    chapter_id = str(ULID())

    # Create parent and two children
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

    main_line = Variation(
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

    alternative = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(main_line)
    await variation_repo.create_variation(alternative)
    await session.commit()

    # Promote with correct version
    service = VariationService(session, variation_repo, event_bus)
    command = PromoteVariationCommand(
        variation_id=alternative.id,
        actor_id="user1",
        expected_version=1,  # Correct version
    )

    await service.promote_variation(command)

    # Verify promotion worked and versions incremented
    promoted = await variation_repo.get_variation_by_id(alternative.id)
    demoted = await variation_repo.get_variation_by_id(main_line.id)

    assert promoted.rank == 0
    assert promoted.version == 2  # Incremented
    assert demoted.rank == 1
    assert demoted.version == 2  # Incremented


@pytest.mark.asyncio
async def test_promote_variation_optimistic_lock_conflict(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test promoting with wrong version (optimistic lock conflict)."""
    chapter_id = str(ULID())

    # Create parent and two children
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

    main_line = Variation(
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

    alternative = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,
        created_by="user1",
        version=3,  # Current version is 3
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(main_line)
    await variation_repo.create_variation(alternative)
    await session.commit()

    # Try to promote with outdated version
    service = VariationService(session, variation_repo, event_bus)
    command = PromoteVariationCommand(
        variation_id=alternative.id,
        actor_id="user1",
        expected_version=1,  # Outdated version
    )

    with pytest.raises(OptimisticLockError, match="Version conflict"):
        await service.promote_variation(command)

    # Verify nothing changed
    unchanged = await variation_repo.get_variation_by_id(alternative.id)
    assert unchanged.rank == 1  # Still alternative
    assert unchanged.version == 3  # Still version 3


@pytest.mark.asyncio
async def test_demote_variation_optimistic_lock_success(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test demoting with correct version (optimistic lock success)."""
    chapter_id = str(ULID())

    # Create parent and two children
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

    main_line = Variation(
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
        version=2,
    )

    alternative = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(main_line)
    await variation_repo.create_variation(alternative)
    await session.commit()

    # Demote with correct version
    service = VariationService(session, variation_repo, event_bus)
    command = DemoteVariationCommand(
        variation_id=main_line.id,
        target_rank=1,
        actor_id="user1",
        expected_version=2,  # Correct version
    )

    await service.demote_variation(command)

    # Verify demotion worked and versions incremented
    demoted = await variation_repo.get_variation_by_id(main_line.id)
    promoted = await variation_repo.get_variation_by_id(alternative.id)

    assert demoted.rank == 1
    assert demoted.version == 3  # Incremented
    assert promoted.rank == 0
    assert promoted.version == 2  # Incremented


@pytest.mark.asyncio
async def test_demote_variation_optimistic_lock_conflict(
    session,
    variation_repo: VariationRepository,
    event_bus: EventBus,
):
    """Test demoting with wrong version (optimistic lock conflict)."""
    chapter_id = str(ULID())

    # Create parent and two children
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

    main_line = Variation(
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
        version=5,  # Current version is 5
    )

    alternative = Variation(
        id=str(ULID()),
        chapter_id=chapter_id,
        parent_id=parent.id,
        move_number=1,
        color="black",
        san="c5",
        uci="c7c5",
        fen="fen3",
        rank=1,
        created_by="user1",
        version=1,
    )

    await variation_repo.create_variation(parent)
    await variation_repo.create_variation(main_line)
    await variation_repo.create_variation(alternative)
    await session.commit()

    # Try to demote with outdated version
    service = VariationService(session, variation_repo, event_bus)
    command = DemoteVariationCommand(
        variation_id=main_line.id,
        target_rank=1,
        actor_id="user1",
        expected_version=2,  # Outdated version
    )

    with pytest.raises(OptimisticLockError, match="Version conflict"):
        await service.demote_variation(command)

    # Verify nothing changed
    unchanged = await variation_repo.get_variation_by_id(main_line.id)
    assert unchanged.rank == 0  # Still main line
    assert unchanged.version == 5  # Still version 5
