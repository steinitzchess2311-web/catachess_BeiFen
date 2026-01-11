"""Edge-case export tests."""
from pathlib import Path

from workspace.pgn.cleaner.no_comment_pgn import export_no_comment_pgn
from workspace.pgn.serializer.to_tree import pgn_to_tree

ROOT = Path(__file__).resolve().parents[1]
VECTORS = ROOT / "pgn" / "tests_vectors"


def test_single_move_variation_kept():
    pgn = "1. e4 (1. d4) e5 *"
    exported = export_no_comment_pgn(pgn_to_tree(pgn), include_headers=False)
    assert "d4" in exported


def test_deeply_nested_variations_export():
    pgn = (VECTORS / "sample_variations.pgn").read_text()
    exported = export_no_comment_pgn(pgn_to_tree(pgn), include_headers=False)
    assert "Bc5" in exported


def test_edge_cases_file_parses():
    pgn = (VECTORS / "sample_edge_cases.pgn").read_text()
    exported = export_no_comment_pgn(pgn_to_tree(pgn), include_headers=False)
    assert "e4" in exported
