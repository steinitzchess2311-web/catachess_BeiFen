"""
Tests for MoveAnnotation domain model.
"""

import pytest
from datetime import datetime

from workspace.domain.models.move_annotation import (
    MoveAnnotationModel,
    AddMoveAnnotationCommand,
    UpdateMoveAnnotationCommand,
    SetNAGCommand,
)


def test_move_annotation_model_with_nag():
    """Test MoveAnnotationModel with NAG."""
    annotation = MoveAnnotationModel(
        id="ann1",
        move_id="move1",
        nag="!",
        text=None,
        author_id="user1",
        version=1,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    assert annotation.has_nag is True
    assert annotation.has_text is False
    assert annotation.is_empty is False


def test_move_annotation_model_with_text():
    """Test MoveAnnotationModel with text."""
    annotation = MoveAnnotationModel(
        id="ann1",
        move_id="move1",
        nag=None,
        text="Excellent move!",
        author_id="user1",
        version=1,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    assert annotation.has_nag is False
    assert annotation.has_text is True
    assert annotation.is_empty is False


def test_move_annotation_model_with_both():
    """Test MoveAnnotationModel with both NAG and text."""
    annotation = MoveAnnotationModel(
        id="ann1",
        move_id="move1",
        nag="!!",
        text="Brilliant sacrifice!",
        author_id="user1",
        version=1,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    assert annotation.has_nag is True
    assert annotation.has_text is True
    assert annotation.is_empty is False


def test_move_annotation_model_empty():
    """Test empty annotation."""
    annotation = MoveAnnotationModel(
        id="ann1",
        move_id="move1",
        nag=None,
        text="",
        author_id="user1",
        version=1,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    assert annotation.has_nag is False
    assert annotation.has_text is False
    assert annotation.is_empty is True


def test_add_move_annotation_command_with_nag():
    """Test AddMoveAnnotationCommand with NAG."""
    cmd = AddMoveAnnotationCommand(
        move_id="move1",
        author_id="user1",
        nag="!",
    )

    assert cmd.nag == "!"
    assert cmd.text is None


def test_add_move_annotation_command_with_text():
    """Test AddMoveAnnotationCommand with text."""
    cmd = AddMoveAnnotationCommand(
        move_id="move1",
        author_id="user1",
        text="Good move",
    )

    assert cmd.nag is None
    assert cmd.text == "Good move"


def test_add_move_annotation_command_with_both():
    """Test AddMoveAnnotationCommand with both NAG and text."""
    cmd = AddMoveAnnotationCommand(
        move_id="move1",
        author_id="user1",
        nag="!",
        text="Good move",
    )

    assert cmd.nag == "!"
    assert cmd.text == "Good move"


def test_add_move_annotation_command_validation_fails():
    """Test that AddMoveAnnotationCommand validates input."""
    with pytest.raises(ValueError, match="must have either NAG or text"):
        AddMoveAnnotationCommand(
            move_id="move1",
            author_id="user1",
        )


def test_add_move_annotation_command_empty_text_fails():
    """Test that empty text is rejected."""
    with pytest.raises(ValueError, match="must have either NAG or text"):
        AddMoveAnnotationCommand(
            move_id="move1",
            author_id="user1",
            text="   ",
        )


def test_update_move_annotation_command():
    """Test UpdateMoveAnnotationCommand."""
    cmd = UpdateMoveAnnotationCommand(
        annotation_id="ann1",
        version=1,
        actor_id="user1",
        nag="!!",
        text="Updated text",
    )

    assert cmd.annotation_id == "ann1"
    assert cmd.version == 1
    assert cmd.nag == "!!"
    assert cmd.text == "Updated text"


def test_update_move_annotation_command_validation_fails():
    """Test that UpdateMoveAnnotationCommand validates input."""
    with pytest.raises(ValueError, match="must have either NAG or text"):
        UpdateMoveAnnotationCommand(
            annotation_id="ann1",
            version=1,
            actor_id="user1",
        )


def test_set_nag_command_valid():
    """Test SetNAGCommand with valid NAG."""
    cmd = SetNAGCommand(
        move_id="move1",
        nag="!",
        actor_id="user1",
    )

    assert cmd.nag == "!"


def test_set_nag_command_invalid():
    """Test that SetNAGCommand validates NAG symbol."""
    with pytest.raises(ValueError, match="Invalid NAG symbol"):
        SetNAGCommand(
            move_id="move1",
            nag="invalid",
            actor_id="user1",
        )


def test_set_nag_command_all_valid_nags():
    """Test all valid NAG symbols."""
    valid_nags = ["!", "?", "!!", "??", "!?", "?!"]

    for nag in valid_nags:
        cmd = SetNAGCommand(
            move_id="move1",
            nag=nag,
            actor_id="user1",
        )
        assert cmd.nag == nag
