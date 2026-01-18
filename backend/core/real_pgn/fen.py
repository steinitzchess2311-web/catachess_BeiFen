from typing import Dict, Tuple
import chess
from backend.core.real_pgn.models import NodeTree

# From stage1c.md: PGN-Implementaion

def apply_move(parent_fen: str, move_san: str) -> Tuple[str, int, int]:
    """
    Applies a single move to a FEN, validates it, and returns the new state.
    
    Returns:
        A tuple containing (new_fen, new_ply, new_move_number).
    """
    try:
        board = chess.Board(parent_fen)
        move = board.parse_san(move_san)
        board.push(move)
        
        new_fen = board.fen()
        new_ply = board.ply
        new_move_number = board.fullmove_number
        
        return new_fen, new_ply, new_move_number
    except Exception as e:
        raise ValueError(f"Invalid move '{move_san}' for FEN '{parent_fen}': {e}")


def build_fen_index(tree: NodeTree) -> Dict[str, str]:
    """
    Generates a dictionary mapping each node_id to its FEN.
    
    The FEN is pre-calculated during the parsing stage and stored on the node.
    This function simply extracts it into a separate index.
    """
    if not tree.nodes:
        return {}
        
    return {node_id: node.fen for node_id, node in tree.nodes.items() if node.fen}

