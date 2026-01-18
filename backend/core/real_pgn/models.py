from dataclasses import dataclass, field
from typing import Dict, List, Optional

# From stage1a.md: PGN-Implementaion

@dataclass
class PgnNode:
    node_id: str
    parent_id: Optional[str]
    san: str
    uci: str
    ply: int
    move_number: int
    comment_before: str = ""
    comment_after: str = ""
    nags: List[int] = field(default_factory=list)
    variations: List[str] = field(default_factory=list)
    fen: str = ""

@dataclass
class GameMeta:
    headers: Dict[str, str] = field(default_factory=dict)
    result: Optional[str] = None
    setup_fen: Optional[str] = None
    # startpos handling can be managed by checking if setup_fen is None

@dataclass
class NodeTree:
    nodes: Dict[str, PgnNode] = field(default_factory=dict)
    root_id: Optional[str] = None
    meta: GameMeta = field(default_factory=GameMeta)

