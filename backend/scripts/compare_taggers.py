"""
Compare rule_tagger2 and catachess tagger outputs.
Test on sample positions to identify missing tags.
"""
import sys
from pathlib import Path

# Sample positions from Tal games
TEST_POSITIONS = [
    {
        "name": "Tal - Opening development",
        "fen": "rnbqkb1r/pppppppp/5n2/8/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 1 2",
        "move": "g2g3",
        "expected_tags": ["opening", "maneuver", "prophylactic"],
    },
    {
        "name": "Tal - Knight sacrifice setup",
        "fen": "r1bqr1k1/ppp2pbp/2np1np1/4p3/2BPP3/2N2N2/PPP1QPPP/R1B1K2R w KQ - 0 10",
        "move": "c3d5",
        "expected_tags": ["initiative", "tactical", "sacrifice"],
    },
    {
        "name": "Tal - Piece control",
        "fen": "r1bqkb1r/ppp2ppp/2np1n2/4p3/2BPP3/2N2N2/PPP2PPP/R1BQK2R w KQkq - 0 6",
        "move": "e1g1",  # Castling
        "expected_tags": ["prophylactic", "structural_integrity"],
    },
    {
        "name": "Tal - Tension creation",
        "fen": "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq d6 0 5",
        "move": "c4d5",
        "expected_tags": ["tension_creation", "initiative"],
    },
]


def test_rule_tagger2(fen: str, move: str):
    """Test with rule_tagger2."""
    try:
        sys.path.insert(0, "/home/catadragon/Code/ChessorTag_final/chess_imitator/rule_tagger_lichessbot")
        from codex_utils import analyze_position

        result = analyze_position(fen, move)
        tags = result.get("tags_final", [])
        return {"success": True, "tags": tags, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


def test_catachess(fen: str, move: str):
    """Test with catachess tagger."""
    try:
        sys.path.insert(0, "/home/catadragon/Code/catachess/backend")
        from core.tagger.facade import tag_position

        result = tag_position(
            engine_path=None,  # Use default
            fen=fen,
            played_move_uci=move,
        )

        # Extract all fired tags
        tags = []
        for field, value in vars(result).items():
            if isinstance(value, bool) and value:
                tags.append(field)

        return {"success": True, "tags": tags, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


def compare_tags(rule_tagger2_tags, catachess_tags):
    """Compare tag outputs and find differences."""
    rt2_set = set(rule_tagger2_tags)
    cc_set = set(catachess_tags)

    only_in_rt2 = rt2_set - cc_set
    only_in_cc = cc_set - rt2_set
    common = rt2_set & cc_set

    return {
        "only_in_rule_tagger2": sorted(only_in_rt2),
        "only_in_catachess": sorted(only_in_cc),
        "common": sorted(common),
    }


def main():
    print("=" * 80)
    print("TAGGER COMPARISON: rule_tagger2 vs catachess")
    print("=" * 80)
    print()

    all_missing_tags = set()

    for i, position in enumerate(TEST_POSITIONS, 1):
        print(f"\n{'='*80}")
        print(f"Test Position {i}: {position['name']}")
        print(f"FEN: {position['fen']}")
        print(f"Move: {position['move']}")
        print(f"Expected tags: {', '.join(position['expected_tags'])}")
        print(f"{'='*80}\n")

        # Test rule_tagger2
        print("Testing rule_tagger2...")
        rt2_result = test_rule_tagger2(position['fen'], position['move'])
        if rt2_result['success']:
            print(f"✓ rule_tagger2 tags ({len(rt2_result['tags'])}): {', '.join(rt2_result['tags'][:10])}")
            if len(rt2_result['tags']) > 10:
                print(f"  ... and {len(rt2_result['tags']) - 10} more")
        else:
            print(f"✗ rule_tagger2 error: {rt2_result['error']}")

        # Test catachess
        print("\nTesting catachess...")
        cc_result = test_catachess(position['fen'], position['move'])
        if cc_result['success']:
            print(f"✓ catachess tags ({len(cc_result['tags'])}): {', '.join(cc_result['tags'][:10])}")
            if len(cc_result['tags']) > 10:
                print(f"  ... and {len(cc_result['tags']) - 10} more")
        else:
            print(f"✗ catachess error: {cc_result['error']}")

        # Compare
        if rt2_result['success'] and cc_result['success']:
            print("\n--- Comparison ---")
            comparison = compare_tags(rt2_result['tags'], cc_result['tags'])

            if comparison['common']:
                print(f"Common tags ({len(comparison['common'])}): {', '.join(comparison['common'][:5])}")
                if len(comparison['common']) > 5:
                    print(f"  ... and {len(comparison['common']) - 5} more")

            if comparison['only_in_rule_tagger2']:
                print(f"\n⚠️  MISSING in catachess ({len(comparison['only_in_rule_tagger2'])} tags):")
                for tag in comparison['only_in_rule_tagger2']:
                    print(f"  - {tag}")
                    all_missing_tags.add(tag)

            if comparison['only_in_catachess']:
                print(f"\n✨ NEW in catachess ({len(comparison['only_in_catachess'])} tags):")
                for tag in comparison['only_in_catachess']:
                    print(f"  + {tag}")

        print()

    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY: Tags missing in catachess")
    print("=" * 80)
    if all_missing_tags:
        print(f"\nTotal unique missing tags: {len(all_missing_tags)}")
        for tag in sorted(all_missing_tags):
            print(f"  - {tag}")
    else:
        print("\n✓ No missing tags detected!")
    print()


if __name__ == "__main__":
    main()
