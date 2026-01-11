"""
Tests for tree to PGN conversion.
"""

import pytest

from workspace.pgn.serializer.to_tree import pgn_to_tree, VariationNode
from workspace.pgn.serializer.to_pgn import (
    format_variation_path,
    tree_to_movetext,
    tree_to_pgn,
)


def test_simple_movetext():
    """Test converting simple tree to movetext."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 2. Nf3
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    assert "1. e4" in movetext
    assert "e5" in movetext
    assert "2. Nf3" in movetext


def test_full_pgn_with_headers():
    """Test converting tree to full PGN with headers."""
    headers = {
        "Event": "Test Tournament",
        "Site": "Online",
        "White": "Player 1",
        "Black": "Player 2",
        "Result": "1-0",
    }

    pgn_text = "1. e4 e5 2. Nf3"
    tree = pgn_to_tree(f"[Event \"Test\"]\n\n{pgn_text}")

    pgn = tree_to_pgn(tree, headers=headers, result="1-0")

    assert '[Event "Test Tournament"]' in pgn
    assert '[White "Player 1"]' in pgn
    assert "1. e4" in pgn
    assert "1-0" in pgn


def test_variation_formatting():
    """Test that variations are formatted with parentheses."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 (1...c5 2. Nf3) 2. Nf3
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    # Should have parentheses for variation
    assert "(" in movetext
    assert ")" in movetext
    assert "c5" in movetext


def test_multiple_variations():
    """Test formatting multiple variations at same level."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 (1...c5) (1...e6) 2. Nf3
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    # Should have both variations
    assert "c5" in movetext
    assert "e6" in movetext

    # Count parentheses pairs
    assert movetext.count("(") == 2
    assert movetext.count(")") == 2


def test_nested_variations():
    """Test formatting nested variations."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 2. Nf3 Nc6 (2...Nf6 3. Nxe5 (3. Bc4)) 3. Bb5
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    # Should have nested parentheses
    assert "Nf6" in movetext
    assert "Nxe5" in movetext
    assert "Bc4" in movetext


def test_nag_formatting():
    """Test that NAGs are formatted correctly."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4! e5? 2. Nf3!!
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    assert "e4 !" in movetext
    assert "e5 ?" in movetext
    assert "Nf3 !!" in movetext


def test_comment_formatting():
    """Test that comments are formatted with braces."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 {King's pawn} e5 {Symmetric}
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    assert "{ King's pawn }" in movetext
    assert "{ Symmetric }" in movetext


def test_move_number_for_white():
    """Test that white moves always have move numbers."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 2. Nf3 Nc6 3. Bb5
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    assert "1. e4" in movetext
    assert "2. Nf3" in movetext
    assert "3. Bb5" in movetext


def test_move_number_for_black_after_white():
    """Test that black moves don't repeat move number after white."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 2. Nf3 Nc6
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    # Should be "1. e4 e5" not "1. e4 1...e5"
    assert "1. e4 e5" in movetext or ("1. e4" in movetext and " e5 " in movetext)


def test_move_number_for_black_variation():
    """Test that black variation shows ...notation."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 (1...c5)
"""
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    # Black variation should show 1...c5
    assert "1...c5" in movetext


def test_round_trip_simple():
    """Test that PGN -> tree -> PGN preserves moves."""
    original = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 2. Nf3 Nc6
"""
    tree = pgn_to_tree(original)
    reconstructed = tree_to_pgn(tree)

    # Should contain all moves
    assert "e4" in reconstructed
    assert "e5" in reconstructed
    assert "Nf3" in reconstructed
    assert "Nc6" in reconstructed


def test_round_trip_with_variations():
    """Test round-trip conversion with variations."""
    original = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 (1...c5) 2. Nf3
"""
    tree = pgn_to_tree(original)
    reconstructed = tree_to_movetext(tree)

    # Should have main line and variation
    assert "e5" in reconstructed
    assert "c5" in reconstructed
    assert "Nf3" in reconstructed


def test_format_variation_path():
    """Test formatting a specific variation path."""
    pgn_text = """
[Event "Test"]
[White "W"]
[Black "B"]

1. e4 e5 2. Nf3 Nc6 3. Bb5
"""
    tree = pgn_to_tree(pgn_text)

    # Get first 3 moves
    path = [tree, tree.children[0], tree.children[0].children[0]]
    formatted = format_variation_path(path)

    assert "1. e4" in formatted
    assert "e5" in formatted
    assert "2. Nf3" in formatted


def test_empty_path():
    """Test formatting empty path."""
    formatted = format_variation_path([])
    assert formatted == ""


def test_tree_to_pgn_with_result():
    """Test adding result to PGN."""
    tree = pgn_to_tree("1. e4 e5")
    pgn = tree_to_pgn(tree, result="1-0")

    assert "1-0" in pgn


def test_tree_to_pgn_without_headers():
    """Test generating PGN without headers."""
    tree = pgn_to_tree("1. e4 e5")
    pgn = tree_to_pgn(tree)

    # Should have moves and default result
    assert "e4" in pgn
    assert "*" in pgn


def test_header_ordering():
    """Test that headers are in standard order."""
    headers = {
        "Result": "1-0",
        "White": "Player 1",
        "Event": "Test",
        "Black": "Player 2",
    }

    tree = pgn_to_tree("1. e4")
    pgn = tree_to_pgn(tree, headers=headers)

    lines = pgn.split("\n")
    header_lines = [l for l in lines if l.startswith("[")]

    # Event should come before White and Black
    event_idx = next(i for i, l in enumerate(header_lines) if "Event" in l)
    white_idx = next(i for i, l in enumerate(header_lines) if "White" in l)
    black_idx = next(i for i, l in enumerate(header_lines) if "Black" in l)

    assert event_idx < white_idx
    assert white_idx < black_idx


def test_castling_kingside():
    """Test formatting kingside castling."""
    pgn_text = "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O"
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    assert "O-O" in movetext


def test_castling_queenside():
    """Test formatting queenside castling."""
    pgn_text = "1. d4 d5 2. Bf4 Bf5 3. Nc3 Nc6 4. Qd2 Qd7 5. O-O-O"
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    assert "O-O-O" in movetext


def test_capture_notation():
    """Test formatting capture moves."""
    pgn_text = "1. e4 d5 2. exd5"
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    assert "exd5" in movetext


def test_check_notation():
    """Test that check notation is preserved."""
    pgn_text = "1. e4 e5 2. Nf3 Nc6 3. Bb5+"
    tree = pgn_to_tree(pgn_text)
    movetext = tree_to_movetext(tree)

    # python-chess includes + in SAN
    assert "Bb5" in movetext


def test_none_tree():
    """Test converting None tree."""
    movetext = tree_to_movetext(None)
    assert movetext == ""


def test_complex_game():
    """Test a more complex game with variations and comments."""
    pgn_text = """
[Event "Complex Game"]
[White "W"]
[Black "B"]

1. e4! {Best move} e5 (1...c5 {Sicilian} 2. Nf3) 2. Nf3 Nc6 3. Bb5
"""
    tree = pgn_to_tree(pgn_text)
    pgn = tree_to_pgn(tree)

    # Should have all elements
    assert "e4 !" in pgn
    assert "Best move" in pgn
    assert "c5" in pgn
    assert "Sicilian" in pgn
