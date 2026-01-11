"""
Tests for Variation domain model.
"""

import pytest
from datetime import datetime

from workspace.db.tables.variations import VariationPriority, VariationVisibility
from workspace.domain.models.variation import (
    AddMoveCommand,
    VariationModel,
    PromoteVariationCommand,
    DemoteVariationCommand,
    ReorderVariationsCommand,
)


def test_variation_model_properties():
    """Test VariationModel properties."""
    variation = VariationModel(
        id="var1",
        chapter_id="ch1",
        parent_id=None,
        next_id=None,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="test_fen",
        rank=0,
        priority=VariationPriority.MAIN,
        visibility=VariationVisibility.PUBLIC,
        pinned=False,
        created_by="user1",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    assert variation.is_main_line is True
    assert variation.is_white_move is True
    assert variation.is_black_move is False
    assert variation.is_pinned is False


def test_variation_model_black_move():
    """Test black move properties."""
    variation = VariationModel(
        id="var1",
        chapter_id="ch1",
        parent_id="parent1",
        next_id=None,
        move_number=1,
        color="black",
        san="e5",
        uci="e7e5",
        fen="test_fen",
        rank=1,
        priority=VariationPriority.ALTERNATIVE,
        visibility=VariationVisibility.PUBLIC,
        pinned=False,
        created_by="user1",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    assert variation.is_main_line is False
    assert variation.is_white_move is False
    assert variation.is_black_move is True


def test_variation_model_pinned():
    """Test pinned variation."""
    variation = VariationModel(
        id="var1",
        chapter_id="ch1",
        parent_id=None,
        next_id=None,
        move_number=1,
        color="white",
        san="e4",
        uci="e2e4",
        fen="test_fen",
        rank=0,
        priority=VariationPriority.MAIN,
        visibility=VariationVisibility.PUBLIC,
        pinned=True,
        created_by="user1",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    assert variation.is_pinned is True


def test_add_move_command_defaults():
    """Test AddMoveCommand with default values."""
    cmd = AddMoveCommand(
        chapter_id="ch1",
        parent_id=None,
        san="e4",
        uci="e2e4",
        fen="test_fen",
        move_number=1,
        color="white",
        created_by="user1",
    )

    assert cmd.rank == 0
    assert cmd.priority == VariationPriority.MAIN
    assert cmd.visibility == VariationVisibility.PUBLIC


def test_add_move_command_custom_values():
    """Test AddMoveCommand with custom values."""
    cmd = AddMoveCommand(
        chapter_id="ch1",
        parent_id="parent1",
        san="c5",
        uci="c7c5",
        fen="test_fen",
        move_number=1,
        color="black",
        created_by="user1",
        rank=1,
        priority=VariationPriority.ALTERNATIVE,
        visibility=VariationVisibility.MEMBERS,
    )

    assert cmd.rank == 1
    assert cmd.priority == VariationPriority.ALTERNATIVE
    assert cmd.visibility == VariationVisibility.MEMBERS


def test_promote_variation_command():
    """Test PromoteVariationCommand creation."""
    cmd = PromoteVariationCommand(
        variation_id="var1",
        actor_id="user1",
    )

    assert cmd.variation_id == "var1"
    assert cmd.actor_id == "user1"


def test_demote_variation_command():
    """Test DemoteVariationCommand creation."""
    cmd = DemoteVariationCommand(
        variation_id="var1",
        target_rank=2,
        actor_id="user1",
    )

    assert cmd.variation_id == "var1"
    assert cmd.target_rank == 2
    assert cmd.actor_id == "user1"


def test_reorder_variations_command():
    """Test ReorderVariationsCommand creation."""
    cmd = ReorderVariationsCommand(
        parent_id="parent1",
        chapter_id="ch1",
        new_order=["var1", "var2", "var3"],
        actor_id="user1",
    )

    assert cmd.parent_id == "parent1"
    assert cmd.chapter_id == "ch1"
    assert len(cmd.new_order) == 3
    assert cmd.new_order[0] == "var1"
