"""Header handling export tests."""
from modules.workspace.pgn.cleaner.no_comment_pgn import export_no_comment_pgn
from modules.workspace.pgn.cleaner.raw_pgn import export_raw_pgn
from modules.workspace.pgn.serializer.to_tree import pgn_to_tree


def test_no_comment_with_headers_kept():
    pgn = "[Event \"X\"]\n\n1. e4 {c} e5 *"
    exported = export_no_comment_pgn(pgn_to_tree(pgn), include_headers=True)
    assert "[Event" in exported
    assert "{" not in exported


def test_raw_with_headers_kept():
    pgn = "[Event \"X\"]\n\n1. e4 (1. d4) e5 *"
    exported = export_raw_pgn(pgn_to_tree(pgn), include_headers=True)
    assert "[Event" in exported
    assert "d4" not in exported


def test_no_comment_keeps_nags():
    pgn = "1. e4 !! e5 ?! 2. Nf3 *"
    exported = export_no_comment_pgn(pgn_to_tree(pgn), include_headers=False)
    assert "!!" in exported
    assert "?!" in exported
