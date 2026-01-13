"""Heavy annotation export tests."""
from pathlib import Path

from modules.workspace.pgn.cleaner.no_comment_pgn import export_no_comment_pgn
from modules.workspace.pgn.cleaner.raw_pgn import export_clean_mainline
from modules.workspace.pgn.serializer.to_tree import pgn_to_tree

ROOT = Path(__file__).resolve().parents[1]
VECTORS = ROOT / "pgn" / "tests_vectors"


def test_heavy_annotation_no_comments():
    pgn = (VECTORS / "sample_heavy_annotation.pgn").read_text()
    exported = export_no_comment_pgn(pgn_to_tree(pgn), include_headers=False)
    assert "{" not in exported


def test_clean_mainline_from_heavy():
    pgn = (VECTORS / "sample_heavy_annotation.pgn").read_text()
    exported = export_clean_mainline(pgn_to_tree(pgn))
    assert "{" not in exported


def test_black_variation_file_exports():
    pgn = (VECTORS / "sample_black_variations.pgn").read_text()
    exported = export_no_comment_pgn(pgn_to_tree(pgn), include_headers=False)
    assert "c5" in exported
