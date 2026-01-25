"""
PGN parser for tagger pipeline.
"""
from __future__ import annotations

from dataclasses import dataclass
from io import StringIO
from typing import Dict, Iterable, List

import chess.pgn


@dataclass
class ParsedGame:
    headers: Dict[str, str]
    moves: List[chess.Move]
    board: chess.Board


def parse_pgn(content: bytes) -> Iterable[ParsedGame]:
    """
    Parse PGN bytes into a stream of ParsedGame objects.
    Only mainline moves are included.
    """
    text = content.decode("utf-8", errors="ignore")
    pgn_io = StringIO(text)

    while True:
        game = chess.pgn.read_game(pgn_io)
        if game is None:
            break
        headers = dict(game.headers)
        moves = list(game.mainline_moves())
        board = game.board()
        yield ParsedGame(headers=headers, moves=moves, board=board)
