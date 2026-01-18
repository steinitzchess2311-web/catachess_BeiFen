import chess
import chess.pgn
import io
import re
from typing import Dict, List, Optional
from ulid import ULID

from backend.core.real_pgn.models import NodeTree, PgnNode, GameMeta

# From stage1b.md: PGN-Implementaion

def parse_pgn(pgn_text: str) -> NodeTree:
    """
    Parses a PGN string into a NodeTree structure.
    
    NOTE: This is a complex task. This implementation is a starting point
    and handles headers and basic movetext. Full support for nested 
    variations, comments, and NAGs requires a more robust parsing strategy.
    """
    tree = NodeTree()
    
    # Use python-chess to handle the heavy lifting of PGN parsing
    try:
        pgn_game = chess.pgn.read_game(io.StringIO(pgn_text))
        if not pgn_game:
            raise ValueError("Invalid PGN or no game found")
    except Exception as e:
        raise ValueError(f"Failed to parse PGN: {e}")

    # 1. Parse Headers and Meta
    tree.meta.headers = dict(pgn_game.headers)
    tree.meta.result = pgn_game.headers.get("Result", None)
    if "FEN" in pgn_game.headers:
        tree.meta.setup_fen = pgn_game.headers["FEN"]

    # 2. Traverse moves to build the NodeTree
    root_node_id = str(ULID())
    tree.root_id = root_node_id
    
    # Create a root node representing the starting position
    board = pgn_game.board()
    root_pgn_node = PgnNode(
        node_id=root_node_id,
        parent_id=None,
        san="<root>",
        uci="<root>",
        ply=0,
        move_number=0,
        fen=board.fen()
    )
    tree.nodes[root_node_id] = root_pgn_node

    _traverse_and_build(pgn_game, root_pgn_node, tree, board)
    
    return tree

def _traverse_and_build(game_node: chess.pgn.GameNode, parent_pgn_node: PgnNode, tree: NodeTree, board: chess.Board):
    """
    Recursive helper to traverse python-chess's game node structure
    and build our custom NodeTree.
    """
    
    # All variations from the current node
    for i, next_game_node in enumerate(game_node.variations):
        # Apply move and create node
        san = board.san(next_game_node.move)
        board.push(next_game_node.move)
        
        node_id = str(ULID())
        move_number = (board.ply() + 1) // 2
        
        pgn_node = PgnNode(
            node_id=node_id,
            parent_id=parent_pgn_node.node_id,
            san=san,
            uci=next_game_node.move.uci(),
            ply=board.ply(),
            move_number=move_number,
            comment_before=game_node.comment,
            comment_after=next_game_node.comment,
            nags=[int(nag) for nag in next_game_node.nags],
            fen=board.fen()
        )
        
        parent_pgn_node.variations.append(node_id)
        tree.nodes[node_id] = pgn_node
        
        # Recurse for the next move
        _traverse_and_build(next_game_node, pgn_node, tree, board)
        
        # Pop the move to backtrack
        board.pop()


