"""
Tagger runner for tagger pipeline.
"""
from __future__ import annotations

from typing import List, Tuple

from core.tagger.facade import tag_position
from core.tagger.config.engine import DEFAULT_DEPTH, DEFAULT_MULTIPV
from core.tagger.tagging import get_primary_tags, apply_suppression_rules


def tag_move(fen: str, move_uci: str) -> Tuple[List[str], int, int]:
    """
    Tag a move, returning (primary_tags, depth, multipv).
    """
    result = tag_position(
        fen=fen,
        played_move_uci=move_uci,
        depth=DEFAULT_DEPTH,
        multipv=DEFAULT_MULTIPV,
        engine_mode="http",
    )
    all_tags = get_primary_tags(result)
    primary_tags, _ = apply_suppression_rules(all_tags)
    return primary_tags, DEFAULT_DEPTH, DEFAULT_MULTIPV
