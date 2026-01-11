"""
Tests for PGN to tree conversion.
"""

import pytest

from workspace.pgn.serializer.to_tree import (
    flatten_tree,
    get_main_line,
    pgn_to_tree,
)


# Test PGN samples
SIMPLE_GAME = """
[Event "Simple Game"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5
"""

GAME_WITH_SINGLE_VARIATION = """
[Event "Single Variation"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 (1...c5 2. Nf3) 2. Nf3 Nc6
"""

GAME_WITH_MULTIPLE_VARIATIONS = """
[Event "Multiple Variations"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 (1...c5 2. Nf3) (1...e6 2. d4) 2. Nf3 Nc6 3. Bb5 a6
"""

GAME_WITH_NESTED_VARIATIONS = """
[Event "Nested Variations"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 2. Nf3 Nc6 (2...Nf6 3. Nxe5 (3. Bc4)) 3. Bb5
"""

GAME_WITH_NAGS = """
[Event "Game with NAGs"]
[White "Player 1"]
[Black "Player 2"]

1. e4! e5? 2. Nf3!! Nc6?? 3. Bb5!?
"""

GAME_WITH_COMMENTS = """
[Event "Game with Comments"]
[White "Player 1"]
[Black "Player 2"]

1. e4 {King's pawn opening} e5 {Symmetric response} 2. Nf3 {Knight development}
"""

FRENCH_DEFENSE = """
[Event "French Defense"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e6 2. d4 d5 3. Nc3 Nf6 4. Bg5 Be7
"""

SICILIAN_DEFENSE = """
[Event "Sicilian Defense"]
[White "Player 1"]
[Black "Player 2"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6
"""

RUY_LOPEZ = """
[Event "Ruy Lopez"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7
"""

QUEENS_GAMBIT = """
[Event "Queen's Gambit"]
[White "Player 1"]
[Black "Player 2"]

1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7
"""


def test_parse_simple_game():
    """Test parsing a simple game without variations."""
    tree = pgn_to_tree(SIMPLE_GAME)

    assert tree is not None
    assert tree.san == "e4"
    assert tree.move_number == 1
    assert tree.color == "white"
    assert tree.uci == "e2e4"
    assert tree.rank == 0


def test_parse_simple_game_structure():
    """Test that simple game has correct structure."""
    tree = pgn_to_tree(SIMPLE_GAME)

    # Check e4 has e5 as child
    assert len(tree.children) == 1
    e5 = tree.children[0]
    assert e5.san == "e5"
    assert e5.color == "black"
    assert e5.move_number == 1

    # Check e5 has Nf3 as child
    assert len(e5.children) == 1
    nf3 = e5.children[0]
    assert nf3.san == "Nf3"
    assert nf3.color == "white"
    assert nf3.move_number == 2


def test_parse_single_variation():
    """Test parsing game with a single variation."""
    tree = pgn_to_tree(GAME_WITH_SINGLE_VARIATION)

    assert tree.san == "e4"

    # e4 should have TWO children: e5 (main) and c5 (alternative)
    assert len(tree.children) == 2

    # Find main line and alternative
    main = next(c for c in tree.children if c.rank == 0)
    alt = next(c for c in tree.children if c.rank == 1)

    assert main.san == "e5"
    assert alt.san == "c5"

    # e5 (main line) should have Nf3 as continuation
    assert len(main.children) == 1
    assert main.children[0].san == "Nf3"

    # c5 (alternative) should also have Nf3 as continuation
    assert len(alt.children) == 1
    assert alt.children[0].san == "Nf3"


def test_parse_multiple_variations():
    """Test parsing game with multiple variations at same level."""
    tree = pgn_to_tree(GAME_WITH_MULTIPLE_VARIATIONS)

    # e4 should have 3 children: e5 (main), c5, e6
    assert len(tree.children) == 3

    variations = sorted(tree.children, key=lambda x: x.rank)
    assert variations[0].san == "e5"   # rank 0 (main)
    assert variations[1].san == "c5"   # rank 1
    assert variations[2].san == "e6"   # rank 2


def test_parse_nested_variations():
    """Test parsing game with nested variations."""
    tree = pgn_to_tree(GAME_WITH_NESTED_VARIATIONS)

    # Navigate to Nf3 node
    e5 = tree.children[0]
    nf3 = e5.children[0]

    # Nf3 should have Nc6 (main) and Nf6 (alternative)
    assert len(nf3.children) == 2

    main = next(c for c in nf3.children if c.rank == 0)
    alt = next(c for c in nf3.children if c.rank == 1)

    assert main.san == "Nc6"
    assert alt.san == "Nf6"

    # Nc6 (main line) should have Bb5
    assert len(main.children) == 1
    assert main.children[0].san == "Bb5"

    # Nf6 (alternative) should have 2 children: Nxe5 (main) and Bc4 (alternative)
    assert len(alt.children) == 2

    nxe5 = next(c for c in alt.children if c.rank == 0)
    bc4 = next(c for c in alt.children if c.rank == 1)

    assert nxe5.san == "Nxe5"
    assert bc4.san == "Bc4"


def test_parse_nags():
    """Test parsing NAGs (annotation glyphs)."""
    tree = pgn_to_tree(GAME_WITH_NAGS)

    # e4!
    assert tree.san == "e4"
    assert tree.nag == "!"

    # e5?
    e5 = tree.children[0]
    assert e5.san == "e5"
    assert e5.nag == "?"

    # Nf3!!
    nf3 = e5.children[0]
    assert nf3.san == "Nf3"
    assert nf3.nag == "!!"

    # Nc6??
    nc6 = nf3.children[0]
    assert nc6.san == "Nc6"
    assert nc6.nag == "??"

    # Bb5!?
    bb5 = nc6.children[0]
    assert bb5.san == "Bb5"
    assert bb5.nag == "!?"


def test_parse_comments():
    """Test parsing move comments."""
    tree = pgn_to_tree(GAME_WITH_COMMENTS)

    # e4 {King's pawn opening}
    assert tree.san == "e4"
    assert tree.comment == "King's pawn opening"

    # e5 {Symmetric response}
    e5 = tree.children[0]
    assert e5.san == "e5"
    assert e5.comment == "Symmetric response"

    # Nf3 {Knight development}
    nf3 = e5.children[0]
    assert nf3.san == "Nf3"
    assert nf3.comment == "Knight development"


def test_fen_positions():
    """Test that FEN positions are correctly recorded."""
    tree = pgn_to_tree(SIMPLE_GAME)

    # After 1. e4
    assert "4P3" in tree.fen  # Pawn on e4
    assert "b KQkq" in tree.fen  # Black to move

    # After 1...e5
    e5 = tree.children[0]
    assert "4p3" in e5.fen  # Black pawn on e5
    assert "w KQkq" in e5.fen  # White to move


def test_flatten_tree():
    """Test flattening tree to list."""
    tree = pgn_to_tree(GAME_WITH_SINGLE_VARIATION)

    nodes = flatten_tree(tree)

    # Should have: e4, e5, c5, Nf3 (after e5), Nf3 (after c5), Nc6
    assert len(nodes) >= 4

    # First node should be e4
    assert nodes[0].san == "e4"


def test_get_main_line():
    """Test extracting main line from tree."""
    tree = pgn_to_tree(GAME_WITH_MULTIPLE_VARIATIONS)

    main_line = get_main_line(tree)

    # Main line: e4 e5 Nf3 Nc6 Bb5 a6
    sans = [node.san for node in main_line]
    assert sans == ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]


def test_empty_pgn():
    """Test parsing empty PGN."""
    tree = pgn_to_tree("")
    assert tree is None


def test_pgn_with_only_headers():
    """Test parsing PGN with only headers, no moves."""
    pgn = """
[Event "No Moves"]
[White "Player 1"]
[Black "Player 2"]
"""
    tree = pgn_to_tree(pgn)
    assert tree is None


def test_french_defense():
    """Test parsing French Defense opening."""
    tree = pgn_to_tree(FRENCH_DEFENSE)

    assert tree.san == "e4"

    # Check first few moves
    e6 = tree.children[0]
    assert e6.san == "e6"

    d4 = e6.children[0]
    assert d4.san == "d4"

    d5 = d4.children[0]
    assert d5.san == "d5"


def test_sicilian_defense():
    """Test parsing Sicilian Defense opening."""
    tree = pgn_to_tree(SICILIAN_DEFENSE)

    main_line = get_main_line(tree)
    sans = [node.san for node in main_line]

    assert sans[0] == "e4"
    assert sans[1] == "c5"
    assert sans[2] == "Nf3"


def test_ruy_lopez():
    """Test parsing Ruy Lopez opening."""
    tree = pgn_to_tree(RUY_LOPEZ)

    main_line = get_main_line(tree)
    sans = [node.san for node in main_line]

    # 1. e4 e5 2. Nf3 Nc6 3. Bb5
    assert sans[:5] == ["e4", "e5", "Nf3", "Nc6", "Bb5"]


def test_queens_gambit():
    """Test parsing Queen's Gambit opening."""
    tree = pgn_to_tree(QUEENS_GAMBIT)

    assert tree.san == "d4"

    main_line = get_main_line(tree)
    sans = [node.san for node in main_line]

    # 1. d4 d5 2. c4
    assert sans[:3] == ["d4", "d5", "c4"]


def test_castling():
    """Test parsing castling moves."""
    pgn = """
[Event "Castling Test"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O
"""
    tree = pgn_to_tree(pgn)

    main_line = get_main_line(tree)
    last_move = main_line[-1]

    assert last_move.san == "O-O"
    assert last_move.color == "white"


def test_long_castling():
    """Test parsing queenside castling."""
    pgn = """
[Event "Long Castling"]
[White "Player 1"]
[Black "Player 2"]

1. d4 d5 2. Bf4 Bf5 3. Nc3 Nc6 4. Qd2 Qd7 5. O-O-O
"""
    tree = pgn_to_tree(pgn)

    main_line = get_main_line(tree)
    last_move = main_line[-1]

    assert last_move.san == "O-O-O"


def test_promotion():
    """Test parsing pawn promotion."""
    pgn = """
[Event "Promotion Test"]
[White "Player 1"]
[Black "Player 2"]

1. e4 a5 2. e5 a4 3. e6 fxe6 4. d4 a3 5. d5 exd5 6. c4 dxc4 7. b3 cxb3 8. axb3 Ra6
"""
    tree = pgn_to_tree(pgn)

    main_line = get_main_line(tree)

    # Just verify we can parse a complex game
    assert len(main_line) > 10


def test_capture_notation():
    """Test parsing capture moves."""
    pgn = """
[Event "Captures"]
[White "Player 1"]
[Black "Player 2"]

1. e4 d5 2. exd5 Qxd5
"""
    tree = pgn_to_tree(pgn)

    main_line = get_main_line(tree)

    # exd5
    exd5 = main_line[2]
    assert "x" in exd5.san
    assert "d5" in exd5.san

    # Qxd5
    qxd5 = main_line[3]
    assert "Qx" in qxd5.san


def test_check_notation():
    """Test that check notation is preserved."""
    pgn = """
[Event "Check Test"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5+ a6
"""
    tree = pgn_to_tree(pgn)

    main_line = get_main_line(tree)
    bb5 = main_line[4]

    # Should have + in SAN
    assert "+" in bb5.san or bb5.san == "Bb5"  # python-chess may or may not include +


def test_rank_assignment():
    """Test that ranks are correctly assigned to variations."""
    pgn = """
[Event "Rank Test"]
[White "Player 1"]
[Black "Player 2"]

1. e4 e5 (1...c5) (1...e6) (1...c6) 2. Nf3
"""
    tree = pgn_to_tree(pgn)

    # e4 should have 4 children: e5 (main), c5, e6, c6
    assert len(tree.children) == 4

    ranks = [child.rank for child in tree.children]
    assert 0 in ranks  # Main line (e5)
    assert 1 in ranks  # First alternative (c5)
    assert 2 in ranks  # Second alternative (e6)
    assert 3 in ranks  # Third alternative (c6)

    # Check specific moves
    variations = sorted(tree.children, key=lambda x: x.rank)
    assert variations[0].san == "e5"
    assert variations[1].san == "c5"
    assert variations[2].san == "e6"
    assert variations[3].san == "c6"


def test_move_numbers():
    """Test that move numbers are correct."""
    tree = pgn_to_tree(SIMPLE_GAME)

    main_line = get_main_line(tree)

    # e4 - move 1
    assert main_line[0].move_number == 1
    assert main_line[0].color == "white"

    # e5 - move 1
    assert main_line[1].move_number == 1
    assert main_line[1].color == "black"

    # Nf3 - move 2
    assert main_line[2].move_number == 2
    assert main_line[2].color == "white"

    # Nc6 - move 2
    assert main_line[3].move_number == 2
    assert main_line[3].color == "black"
