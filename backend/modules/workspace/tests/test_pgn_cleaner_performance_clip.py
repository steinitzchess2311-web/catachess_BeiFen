"""PGN clip performance tests."""
from time import perf_counter

from workspace.pgn.cleaner.pgn_cleaner import clip_pgn_from_move
from workspace.pgn.serializer.to_tree import pgn_to_tree


def _loop_pgn(moves: int, with_comments: bool = False) -> str:
    parts = []
    for move in range(1, moves + 1):
        white = "Nf3"
        black = "Nf6" if move % 2 == 1 else "Ng8"
        if move % 2 == 0:
            white = "Ng1"
        if with_comments:
            parts.append(f"{move}. {white} {{c}} {black} {{c}}")
        else:
            parts.append(f"{move}. {white} {black}")
    return "\n".join(parts) + " *"


def test_clip_large_game():
    tree = pgn_to_tree(_loop_pgn(120))
    start = perf_counter()
    clip_pgn_from_move(tree, "main.60", include_headers=False)
    assert perf_counter() - start < 0.5


def test_clip_heavily_annotated():
    tree = pgn_to_tree(_loop_pgn(120, with_comments=True))
    start = perf_counter()
    clip_pgn_from_move(tree, "main.60", include_headers=False)
    assert perf_counter() - start < 1.0


def test_clip_deeply_nested():
    deep_pgn = (
        "1. e4 (1. d4 (1. c4 (1. Nf3 (1. g3 (1. b3 (1. Nc3 "
        "(1. d3 (1. b4 (1. a3 (1. h3)))))))))) e5 2. Nf3 *"
    )
    tree = pgn_to_tree(deep_pgn)
    start = perf_counter()
    clip_pgn_from_move(tree, "main.2", include_headers=False)
    assert perf_counter() - start < 2.0
