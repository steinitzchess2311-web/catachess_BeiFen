"""PGN export performance tests."""
import asyncio
import tracemalloc
from time import perf_counter

import pytest

from workspace.pgn.cleaner.no_comment_pgn import export_no_comment_pgn
from workspace.pgn.cleaner.pgn_cleaner import clip_pgn_from_move
from workspace.pgn.serializer.to_tree import pgn_to_tree


def _loop_pgn(moves: int, with_comments: bool = False) -> str:
    parts = []
    for move in range(1, moves + 1):
        white = "Nf3" if move % 2 == 1 else "Ng1"
        black = "Nf6" if move % 2 == 1 else "Ng8"
        if with_comments:
            parts.append(f"{move}. {white} {{c}} {black} {{c}}")
        else:
            parts.append(f"{move}. {white} {black}")
    return "\n".join(parts) + " *"


def test_export_no_comment_large():
    tree = pgn_to_tree(_loop_pgn(500, with_comments=True))
    start = perf_counter()
    export_no_comment_pgn(tree, include_headers=False)
    assert perf_counter() - start < 1.0


@pytest.mark.asyncio
async def test_concurrent_clips():
    tree = pgn_to_tree(_loop_pgn(40))

    async def _run():
        return await asyncio.to_thread(
            clip_pgn_from_move, tree, "main.20", False
        )

    start = perf_counter()
    await asyncio.gather(*[_run() for _ in range(10)])
    assert perf_counter() - start < 2.0


def test_memory_usage():
    tree = pgn_to_tree(_loop_pgn(80))
    tracemalloc.start()
    for _ in range(10):
        clip_pgn_from_move(tree, "main.10", include_headers=False)
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    assert peak < 100 * 1024 * 1024
