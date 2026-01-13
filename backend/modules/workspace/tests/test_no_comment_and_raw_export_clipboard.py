"""Clipboard export tests."""
from modules.workspace.pgn.cleaner.no_comment_pgn import export_no_comment_pgn_to_clipboard
from modules.workspace.pgn.cleaner.raw_pgn import export_raw_pgn_to_clipboard
from modules.workspace.pgn.serializer.to_tree import pgn_to_tree


def _tree(pgn: str):
    return pgn_to_tree(pgn)


def test_no_comment_clipboard_omits_headers():
    pgn = "[Event \"X\"]\n\n1. e4 {c} e5 *"
    exported = export_no_comment_pgn_to_clipboard(_tree(pgn))
    assert "[Event" not in exported
    assert "{" not in exported


def test_raw_clipboard_omits_headers():
    pgn = "[Event \"X\"]\n\n1. e4 e5 2. Nf3 *"
    exported = export_raw_pgn_to_clipboard(_tree(pgn))
    assert "[Event" not in exported
    assert "Nf3" in exported


def test_raw_clipboard_drops_variations():
    pgn = "1. e4 (1. d4) e5 *"
    exported = export_raw_pgn_to_clipboard(_tree(pgn))
    assert "d4" not in exported
