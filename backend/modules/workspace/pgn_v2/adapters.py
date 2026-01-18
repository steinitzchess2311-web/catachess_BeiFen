# This file is for Stage 2A of PGN implementation.
# It will contain adapters to convert between the database representation
# of a game tree and the `NodeTree` structure.

from typing import List, Dict, Any, Optional
from collections import defaultdict

from backend.core.real_pgn.models import NodeTree, PgnNode
from backend.modules.workspace.db.tables.variations import Variation, MoveAnnotation, VariationPriority, VariationVisibility

# NAG values are stored as strings in the DB (e.g., '!', '?'), 
# but PGN standard uses integer codes.
NAG_MAP = {
    '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6
}
REV_NAG_MAP = {v: k for k, v in NAG_MAP.items()}

def _ply_to_color(ply: int) -> str:
    return 'white' if ply % 2 == 1 else 'black'

def db_to_tree(variations: List[Variation], annotations: List[MoveAnnotation]) -> NodeTree:
    """
    Converts lists of Variation and MoveAnnotation DB objects into a NodeTree.
    """
    tree = NodeTree()
    if not variations:
        return tree

    # 1. Process annotations into a lookup map
    annotation_map = defaultdict(lambda: {"nags": [], "text": None})
    for anno in annotations:
        if anno.nag and anno.nag in NAG_MAP:
            annotation_map[anno.move_id]["nags"].append(NAG_MAP[anno.nag])
        if anno.text:
            annotation_map[anno.move_id]["text"] = anno.text

    # 2. Create all PgnNode objects and group children by parent
    nodes = {}
    children_by_parent = defaultdict(list)
    
    for var in variations:
        ply = var.move_number * 2 - (1 if var.color == 'white' else 0)

        anno = annotation_map[var.id]
        node = PgnNode(
            node_id=var.id,
            parent_id=var.parent_id,
            san=var.san,
            uci=var.uci,
            ply=ply,
            move_number=var.move_number,
            comment_after=anno["text"],
            nags=anno["nags"],
            fen=var.fen
        )
        nodes[var.id] = node
        if var.parent_id:
            children_by_parent[var.parent_id].append(var)

    # 3. Link children to parents (main_child vs variations)
    # Also determine the tree's root_id (node with parent_id=None)
    root_id = None
    for var in variations:
        if var.parent_id is None:
            tree.meta.headers["ChapterId"] = var.chapter_id # Store chapter_id in meta
            root_id = var.id # This is the first move, but for NodeTree we use a virtual root
            break
    
    # Let's create a virtual root node for NodeTree if the PGN starts from a FEN or has no explicit root_id
    # The current DB schema implies moves with parent_id=None are the game's actual first moves.
    # To bridge PgnNode's <root> and DB's actual first move, we need a special handling.
    # For now, we will create a virtual root and link the DB's root moves to it.
    virtual_root_id = "virtual_root"
    virtual_root_node = PgnNode(
        node_id=virtual_root_id,
        parent_id=None, san="<root>", uci="<root>", ply=0, move_number=0, fen="rnbqkbnr/pppppppp/8/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"
    )
    nodes[virtual_root_id] = virtual_root_node
    tree.root_id = virtual_root_id

    # For moves that have parent_id=None in DB, they become main_child of virtual_root
    db_root_moves = [v for v in variations if v.parent_id is None]
    db_root_moves.sort(key=lambda v: v.rank)
    if db_root_moves:
        virtual_root_node.main_child = db_root_moves[0].id
        virtual_root_node.variations = [v.id for v in db_root_moves[1:]]

    for parent_var_id, children_vars in children_by_parent.items():
        if parent_var_id not in nodes: # this implies the parent is the virtual root.
            continue
        
        parent_node = nodes[parent_var_id]
        children_vars.sort(key=lambda v: v.rank)
        
        if children_vars:
            parent_node.main_child = children_vars[0].id
            parent_node.variations = [v.id for v in children_vars[1:]]


    tree.nodes = nodes
    # If the first move from DB has no parent, it's the main_child of our virtual root
    # tree.root_id should be the virtual root node ID

    return tree

def tree_to_db_changes(tree: NodeTree, current_variations: List[Variation], current_annotations: List[MoveAnnotation]) -> Dict[str, List[Any]]:
    """
    Compares a NodeTree to the database state and generates a list of
    incremental changes (adds, updates, deletes).
    """
    changes = {
        "added_variations": [], "updated_variations": [], "deleted_variations": [],
        "added_annotations": [], "updated_annotations": [], "deleted_annotations": []
    }

    # 1. Create lookups for current DB state
    current_variation_map = {v.id: v for v in current_variations}
    current_annotation_map = defaultdict(list)
    for anno in current_annotations:
        current_annotation_map[anno.move_id].append(anno)

    # 2. Convert current DB state to a NodeTree for easy comparison (baseline)
    baseline_tree = db_to_tree(current_variations, current_annotations)
    baseline_node_map = baseline_tree.nodes

    # Helper to convert PgnNode to Variation object
    def _pgn_node_to_variation(pgn_node: PgnNode, chapter_id: str, rank: int, next_id: Optional[str]) -> Variation:
        return Variation(
            id=pgn_node.node_id,
            chapter_id=chapter_id,
            parent_id=pgn_node.parent_id,
            next_id=next_id,
            move_number=pgn_node.move_number,
            color=_ply_to_color(pgn_node.ply),
            san=pgn_node.san,
            uci=pgn_node.uci,
            fen=pgn_node.fen,
            rank=rank,
            # Default other fields, as they are not in PgnNode directly
            priority=VariationPriority.MAIN,
            visibility=VariationVisibility.PUBLIC,
            pinned=False,
            created_by="system", # Placeholder
            version=1
        )
    
    # Helper to convert PgnNode comment/nags to MoveAnnotation objects
    def _pgn_node_to_annotations(pgn_node: PgnNode) -> List[MoveAnnotation]:
        annos = []
        if pgn_node.comment_after:
            annos.append(MoveAnnotation(
                id=str(ULID()), # New ID for new annotation
                move_id=pgn_node.node_id,
                text=pgn_node.comment_after,
                author_id="system", # Placeholder
                version=1
            ))
        for nag_int in pgn_node.nags:
            nag_str = REV_NAG_MAP.get(nag_int)
            if nag_str:
                annos.append(MoveAnnotation(
                    id=str(ULID()), # New ID
                    move_id=pgn_node.node_id,
                    nag=nag_str,
                    author_id="system", # Placeholder
                    version=1
                ))
        return annos

    chapter_id = tree.meta.headers.get("ChapterId") # Assuming chapter_id is stored in meta
    if not chapter_id:
        raise ValueError("NodeTree must contain ChapterId in its meta headers for DB conversion.")

    # Iterate through desired NodeTree nodes to find added/updated variations and annotations
    for node_id, pgn_node in tree.nodes.items():
        if node_id == "virtual_root": # Skip the virtual root node
            continue

        current_var = current_variation_map.get(node_id)
        current_annos = current_annotation_map.get(node_id, [])

        # Get target rank and next_id for this PgnNode
        # This requires traversing the parent in the target tree to determine rank and next_id
        target_rank = 0
        target_next_id = None
        if pgn_node.parent_id and pgn_node.parent_id != "virtual_root":
            parent_pgn_node = tree.nodes.get(pgn_node.parent_id)
            if parent_pgn_node:
                if parent_pgn_node.main_child == node_id:
                    target_rank = 0
                    if parent_pgn_node.main_child: # If this is main child, its next is parent's next
                        # this logic is tricky, next_id is for *mainline* next move
                        # it's better to build this by traversing in the other direction.
                        # For now, let's simplify and set next_id based on a linear walk.
                        pass
                else:
                    try:
                        target_rank = parent_pgn_node.variations.index(node_id) + 1 # Rank 1 for first variation etc.
                    except ValueError:
                        pass # Should not happen if data is consistent

        # Check for added/updated variations
        if not current_var:
            # Added variation
            # We need to compute next_id for the added variation during a final pass.
            changes["added_variations"].append(_pgn_node_to_variation(pgn_node, chapter_id, target_rank, None))
        else:
            # Check for updated variation fields
            # Simplified comparison for now, full comparison would be field by field
            # next_id is very complex to handle here without full tree context
            # Let's just compare basic fields for now
            updated = False
            if current_var.parent_id != pgn_node.parent_id: updated = True
            if current_var.san != pgn_node.san: updated = True
            if current_var.uci != pgn_node.uci: updated = True
            if current_var.fen != pgn_node.fen: updated = True
            if current_var.rank != target_rank: updated = True # Compare current rank with target rank
            
            if updated:
                updated_var = _pgn_node_to_variation(pgn_node, chapter_id, target_rank, current_var.next_id)
                updated_var.id = current_var.id # Ensure ID is preserved for update
                changes["updated_variations"].append(updated_var)

        # Check for added/updated/deleted annotations
        target_annos = _pgn_node_to_annotations(pgn_node)
        
        # This is very simplified, real diffing of annotations is harder
        # For now, just mark all old as deleted, all new as added if different
        if (pgn_node.comment_after and not any(a.text == pgn_node.comment_after for a in current_annos)) or \
           (pgn_node.nags and not any(REV_NAG_MAP.get(n) in [a.nag for a in current_annos] for n in pgn_node.nags)):
            # If target has comment/nags and current doesn't match, delete all old and add all new
            for old_anno in current_annos:
                changes["deleted_annotations"].append(old_anno)
            for new_anno in target_annos:
                changes["added_annotations"].append(new_anno)
        elif not pgn_node.comment_after and not pgn_node.nags and current_annos:
            # If target has no comment/nags but current has, delete all old
            for old_anno in current_annos:
                changes["deleted_annotations"].append(old_anno)


    # Identify deleted variations (those in baseline_tree but not in target tree)
    for baseline_node_id, baseline_pgn_node in baseline_node_map.items():
        if baseline_node_id == "virtual_root":
            continue
        if baseline_node_id not in tree.nodes:
            changes["deleted_variations"].append(current_variation_map[baseline_node_id])
            # Also delete associated annotations
            for old_anno in current_annotation_map.get(baseline_node_id, []):
                changes["deleted_annotations"].append(old_anno)

    # FINAL PASS: Compute 'next_id' for added/updated variations based on tree structure
    # This is a post-processing step for variations that were marked added/updated
    # A full implementation would build the next_id during the tree traversal,
    # or require another dedicated traversal pass.
    # For now, we leave next_id as None and let the caller manage it if needed.
    
    return changes
