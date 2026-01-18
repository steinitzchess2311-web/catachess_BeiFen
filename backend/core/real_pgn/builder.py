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
        movetext = _build_movetext_recursive(tree, tree.root_id, is_variation_start=False)

    # Append the result at the end of the movetext
    result = tree.meta.result or "*"
    movetext += f" {result}"
    
    lines.append(movetext)
    
    return "\n".join(lines)

def _build_movetext_recursive(tree: NodeTree, node_id: str, is_variation_start: bool) -> str:
    """
    Recursively builds the movetext for a given node and its children.
    """
    node = tree.nodes.get(node_id)
    if not node:
        return ""

    # Skip printing the root node itself, just start with its main line
    if node.san == "<root>":
        if node.main_child:
            return _build_movetext_recursive(tree, node.main_child, is_variation_start=False)
        return ""

    parts = []

    # Comment before move
    if node.comment_before:
        parts.append(f"{{{node.comment_before}}} ")

    # Move number logic
    is_black_move = node.ply % 2 == 0
    if node.ply % 2 == 1:  # White's move
        parts.append(f"{node.move_number}. ")
    elif is_variation_start:  # Black's move starting a variation
        parts.append(f"{node.move_number}... ")

    parts.append(node.san)

    # NAGs
    for nag in node.nags:
        parts.append(f" ${nag}")

    # Comment after move
    if node.comment_after:
        parts.append(f" {{{node.comment_after}}}")
    
    # Side variations are rendered after the move they are alternatives to.
    for var_node_id in node.variations:
        parts.append(f" ({_build_movetext_recursive(tree, var_node_id, is_variation_start=True)})")

    # Main line continues after the current move and its side variations.
    if node.main_child:
        parts.append(" " + _build_movetext_recursive(tree, node.main_child, is_variation_start=False))

    return "".join(parts)
