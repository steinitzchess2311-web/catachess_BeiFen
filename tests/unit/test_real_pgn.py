import pytest
from backend.core.real_pgn.parser import parse_pgn
from backend.core.real_pgn.builder import build_pgn
from backend.core.real_pgn.fen import build_fen_index
from backend.core.real_pgn.show import build_show

SAMPLE_PGN = """
[Event "Sample Game"]
[Site "My Computer"]
[Date "2024.01.01"]
[Round "1"]
[White "Player A"]
[Black "Player B"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 (2... f6 3. Bc4) 3. Bb5 a6 *
"""

def test_parse_and_build_cycle():
    """
    Tests that parsing a PGN and then building it back results in a similar PGN.
    This is a good integration test for the parser and builder.
    """
    # 1. Parse the PGN
    tree = parse_pgn(SAMPLE_PGN)
    
    # Assertions for the parser
    assert tree is not None
    assert tree.meta.headers["Event"] == "Sample Game"
    assert tree.meta.result == "1-0"
    assert len(tree.nodes) > 5 # root + 5 moves + 1 variation move

    # Find specific nodes to check relationships
    e4_node = tree.nodes[tree.nodes[tree.root_id].main_child]
    assert e4_node.san == "e4"
    
    e5_node = tree.nodes[e4_node.main_child]
    assert e5_node.san == "e5"

    nf3_node = tree.nodes[e5_node.main_child]
    assert nf3_node.san == "Nf3"
    assert len(nf3_node.variations) == 1

    # 2. Build the PGN back
    rebuilt_pgn = build_pgn(tree)
    
    # Assertions for the builder
    assert '[Event "Sample Game"]' in rebuilt_pgn
    assert "1. e4 e5" in rebuilt_pgn
    assert "(2... f6 3. Bc4)" in rebuilt_pgn
    assert "3. Bb5 a6" in rebuilt_pgn
    assert rebuilt_pgn.strip().endswith("1-0")

def test_fen_indexer():
    """
    Tests the build_fen_index function.
    """
    tree = parse_pgn(SAMPLE_PGN)
    fen_index = build_fen_index(tree)
    
    assert len(fen_index) == len(tree.nodes)
    
    # Get FEN for a specific position (after 3. Bb5)
    root_node = tree.nodes[tree.root_id]
    e4_node = tree.nodes[root_node.main_child]
    e5_node = tree.nodes[e4_node.main_child]
    nf3_node = tree.nodes[e5_node.main_child]
    nc6_node = tree.nodes[nf3_node.main_child]
    bb5_node_id = nc6_node.main_child # This is 3. Bb5
    
    expected_fen = "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3"
    assert fen_index[bb5_node_id] == expected_fen
def test_show_dto_builder():
    """
    Tests the build_show function with the final, detailed DTO spec.
    """
    tree = parse_pgn(SAMPLE_PGN)
    show_dto = build_show(tree)

    # 1. Check top-level fields
    assert "headers" in show_dto
    assert "nodes" in show_dto
    assert "render" in show_dto
    assert "root_fen" in show_dto
    assert "result" in show_dto
    assert show_dto["result"] == "1-0"

    # 2. Check header format
    assert show_dto["headers"][0] == {"k": "Event", "v": "Sample Game"}

    # 3. Check render token stream
    tokens = show_dto["render"]
    assert len(tokens) > 5

    # Check first move token (1. e4)
    e4_token = tokens[0]
    assert e4_token["t"] == "move"
    assert e4_token["san"] == "e4"
    assert e4_token["label"] == "1."
    
    # Check a mainline black move (1... e5)
    e5_token = tokens[1]
    assert e5_token["t"] == "move"
    assert e5_token["san"] == "e5"
    assert e5_token["label"] == "" # Black move not starting a variation

    # Find the token for 2. Nf3
    nf3_node = next(node for node_id, node in tree.nodes.items() if node.san == "Nf3")
    nf3_token = next(t for t in tokens if t.get("node") == nf3_node.node_id)
    assert nf3_token["label"] == "2."

    # Check variation handling for (2... f6 3. Bc4)
    # Find the variation start token that originates from Nf3
    var_start_token = next(t for t in tokens if t["t"] == "variation_start" and t["from"] == nf3_node.node_id)
    assert var_start_token["t"] == "variation_start"
    assert var_start_token["from"] == nf3_node.node_id

    # Find the token for the start of the variation (2... f6)
    f6_token = next(t for t in tokens if t.get("san") == "f6")
    assert f6_token["t"] == "move"
    assert f6_token["label"] == "(2..." # Black move starting a variation, with parenthesis
    
    # Verify comment token (we don't have one in SAMPLE_PGN, so we'll check structure)
    # We can't directly test if a comment is generated, but we can assert the structure if it were.
    # The code adds node.node_id to comment token, so if a comment token exists it must have it.
    
    # Assert presence of variation_end
    assert any(t["t"] == "variation_end" for t in tokens)

