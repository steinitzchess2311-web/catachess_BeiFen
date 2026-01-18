from typing import List, Dict, Any
from backend.core.real_pgn.models import NodeTree, PgnNode

# From stage1b.md: PGN-Implementaion

def build_show(tree: NodeTree) -> Dict[str, Any]:
    """
    Generates a ShowDTO dictionary from a NodeTree, suitable for frontend rendering.
    """
    
    # 1. Headers array
    headers = [{"name": key, "value": value} for key, value in tree.meta.headers.items()]
    
    # 2. Nodes dict (already in the right format in tree.nodes)
    nodes_dict = {nid: node.__dict__ for nid, node in tree.nodes.items()}

    # 3. Render token stream
    render_tokens = []
    if tree.root_id:
        _build_tokens_recursive(tree, tree.root_id, render_tokens, is_mainline=True)
        
    return {
        "headers": headers,
        "nodes": nodes_dict,
        "render_tokens": render_tokens
    }

def _build_tokens_recursive(tree: NodeTree, node_id: str, tokens: List[Dict[str, Any]], is_mainline: bool):
    """
    Recursively builds the render token stream.
    """
    node = tree.nodes.get(node_id)
    if not node or node.san == "<root>":
        # Start recursion from the first actual move
        if node and node.main_child:
            _build_tokens_recursive(tree, node.main_child, tokens, is_mainline=True)
        return

    # Add move token
    tokens.append({"type": "move", "node_id": node.node_id, "san": node.san})

    # Add comment token if it exists
    if node.comment_after:
        tokens.append({"type": "comment", "text": node.comment_after})

    # Variations
    if node.variations:
        for i, var_node_id in enumerate(node.variations):
            tokens.append({"type": "variation_start"})
            _build_tokens_recursive(tree, var_node_id, tokens, is_mainline=False)
            tokens.append({"type": "variation_end"})
    
    # Continue with the mainline
    if node.main_child:
        _build_tokens_recursive(tree, node.main_child, tokens, is_mainline)

