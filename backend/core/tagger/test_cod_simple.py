#!/usr/bin/env python3
"""
Simple CoD v2 test - verifies boolean tag mapping.
Run from tagger directory: python3 -m test_cod_simple
"""

if __name__ == "__main__":
    import sys
    import os

    # Ensure we're in the right directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    sys.path.insert(0, script_dir)

    # Import using package syntax
    from facade import tag_position

    print("="*60)
    print("CoD v2 Boolean Tag Test")
    print("="*60)

    # Check for Stockfish
    stockfish_paths = [
        "/usr/games/stockfish",
        "/usr/local/bin/stockfish",
        "/usr/bin/stockfish",
    ]

    engine_path = None
    for path in stockfish_paths:
        if os.path.exists(path):
            engine_path = path
            print(f"✓ Found Stockfish: {engine_path}\n")
            break

    if not engine_path:
        print("✗ Stockfish not found")
        print("Install: sudo apt-get install stockfish")
        sys.exit(1)

    # Simple test position
    test_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    test_move = "e2e4"

    print(f"Testing position:")
    print(f"  FEN: {test_fen}")
    print(f"  Move: {test_move}\n")

    try:
        result = tag_position(
            engine_path=engine_path,
            fen=test_fen,
            played_move_uci=test_move,
        )

        print("Results:")
        print(f"  control_over_dynamics: {result.control_over_dynamics}")
        print(f"  control_over_dynamics_subtype: {result.control_over_dynamics_subtype}")

        print("\nCoD v2 subtype boolean tags:")
        print(f"  cod_prophylaxis: {result.cod_prophylaxis}")
        print(f"  piece_control_over_dynamics: {result.piece_control_over_dynamics}")
        print(f"  pawn_control_over_dynamics: {result.pawn_control_over_dynamics}")
        print(f"  control_simplification: {result.control_simplification}")

        print("\nLegacy CoD tags (should all be False):")
        print(f"  cod_simplify: {result.cod_simplify}")
        print(f"  cod_plan_kill: {result.cod_plan_kill}")
        print(f"  cod_freeze_bind: {result.cod_freeze_bind}")

        # Validation
        print("\n" + "="*60)
        print("Validation:")
        print("="*60)

        # Check that if CoD is detected, exactly one boolean tag is set
        if result.control_over_dynamics:
            cod_tags_set = sum([
                result.cod_prophylaxis,
                result.piece_control_over_dynamics,
                result.pawn_control_over_dynamics,
                result.control_simplification,
            ])

            if cod_tags_set == 1:
                print("✓ Exactly one CoD v2 boolean tag is set")
            else:
                print(f"✗ Expected 1 boolean tag, got {cod_tags_set}")

            # Check that subtype string matches boolean tag
            subtype_map = {
                "prophylaxis": result.cod_prophylaxis,
                "piece_control": result.piece_control_over_dynamics,
                "pawn_control": result.pawn_control_over_dynamics,
                "simplification": result.control_simplification,
            }

            if result.control_over_dynamics_subtype in subtype_map:
                expected_tag = subtype_map[result.control_over_dynamics_subtype]
                if expected_tag:
                    print(f"✓ Subtype '{result.control_over_dynamics_subtype}' matches boolean tag")
                else:
                    print(f"✗ Subtype '{result.control_over_dynamics_subtype}' but boolean tag not set")
            else:
                print(f"✗ Unknown subtype: {result.control_over_dynamics_subtype}")

        else:
            print("ℹ No CoD detected for this position (expected for some positions)")

        # Check that legacy tags are never set
        legacy_tags_set = sum([
            result.cod_simplify,
            result.cod_plan_kill,
            result.cod_freeze_bind,
            result.cod_blockade_passed,
            result.cod_file_seal,
            result.cod_king_safety_shell,
            result.cod_space_clamp,
            result.cod_regroup_consolidate,
            result.cod_slowdown,
        ])

        if legacy_tags_set == 0:
            print("✓ All legacy CoD tags are False (as expected)")
        else:
            print(f"✗ {legacy_tags_set} legacy CoD tags are set (should be 0)")

        print("\n" + "="*60)
        print("✓ Test completed successfully")
        print("="*60)

    except Exception as e:
        print(f"\n✗ Error during test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
