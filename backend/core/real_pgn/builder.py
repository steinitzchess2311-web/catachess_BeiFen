from typing import List
from backend.core.real_pgn.models import NodeTree, PgnNode

# From stage1a.md: PGN-Implementaion

def build_pgn(tree: NodeTree) -> str:
    """
    Builds a PGN string from a NodeTree structure.
    """
    lines = []
    
    # 1. Headers
    header_order = ["Event", "Site", "Date", "Round", "White", "Black", "Result"]
    for key in header_order:
        if key in tree.meta.headers:
            lines.append(f'[{key} "{tree.meta.headers[key]}"]')
    
    # Add other headers that are not in the standard order
    for key, value in tree.meta.headers.items():
        if key not in header_order:
            lines.append(f'[{key} "{value}"]')

    if tree.meta.setup_fen:
        lines.append(f'[SetUp "1"]')
        lines.append(f'[FEN "{tree.meta.setup_fen}"]')
    
    lines.append("") # Blank line after headers

    # 2. Movetext
    movetext = ""
    if tree.root_id:
        movetext = _build_movetext_recursive(tree, tree.root_id)

    lines.append(movetext)
    
    # 3. Result
    if tree.meta.result:
        if not movetext.endswith(tree.meta.result):
             lines.append(f" {tree.meta.result}")
    
    return "\n".join(lines)

def _build_movetext_recursive(tree: NodeTree, node_id: str) -> str:
    """
    Recursively builds the movetext for a given node and its children.
    """
    node = tree.nodes.get(node_id)
    if not node:
        return ""

    parts = []

    # Comment before move
    if node.comment_before:
        parts.append(f"{{{node.comment_before}}} ")

    # Move number for white or first move for black
    if node.ply % 2 == 1:
        parts.append(f"{node.move_number}. ")
    elif node.ply == 0: # Black's first move from a FEN setup
        parts.append(f"{node.move_number}... ")

    parts.append(node.san)

    # NAGs
    for nag in node.nags:
        parts.append(f" ${nag}")

    # Comment after move
    if node.comment_after:
        parts.append(f" {{{node.comment_after}}}")

    # Main child (next move in the main line)
    if node.main_child:
        parts.append(" " + _build_movetext_recursive(tree, node.main_child))

    # Variations
    for var_node_id in node.variations:
        parts.append(f" ( {_build_movetext_recursive(tree, var_node_id)} )")

    return "".join(parts)
