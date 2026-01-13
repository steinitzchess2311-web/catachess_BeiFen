"""No-comment and raw export tests (core)."""
from modules.workspace.pgn.cleaner.no_comment_pgn import export_no_comment_pgn
from modules.workspace.pgn.cleaner.raw_pgn import export_clean_mainline, export_raw_pgn
from modules.workspace.pgn.serializer.to_tree import pgn_to_tree


def _tree(pgn: str):
    return pgn_to_tree(pgn)


def test_export_no_comment_keeps_variations():
    pgn = "1. e4 {c} (1. d4) e5 *"
    exported = export_no_comment_pgn(_tree(pgn), include_headers=False)
    assert "d4" in exported
    assert "{" not in exported


def test_export_raw_mainline_only():
    pgn = "1. e4 (1. d4) e5 2. Nf3 *"
    exported = export_raw_pgn(_tree(pgn), include_headers=False)
    assert "d4" not in exported
    assert "Nf3" in exported


def test_export_clean_mainline_strips_comments():
    pgn = "1. e4 {note} e5 2. Nf3 *"
    exported = export_clean_mainline(_tree(pgn))
    assert "{" not in exported
