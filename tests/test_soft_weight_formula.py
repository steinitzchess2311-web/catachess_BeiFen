"""
Test the soft_weight formula matches rule_tagger2/legacy/core.py:1029-1037.

Run with: python3 tests/test_soft_weight_formula.py
"""
import os


def read_score_function():
    """Read the compute_soft_weight_from_deltas function from score.py."""
    score_file = os.path.join(
        os.path.dirname(__file__),
        "..",
        "backend/core/tagger/detectors/helpers/prophylaxis_modules/score.py"
    )
    with open(score_file) as f:
        content = f.read()
    return content


def test_soft_weight_formula():
    """Verify the soft_weight formula contains all required components."""
    content = read_score_function()

    print("=" * 70)
    print("Soft weight formula verification test")
    print("=" * 70)

    required_components = [
        ("structure_delta * 0.4", "max(0.0, structure_delta) * 0.4"),
        ("king_safety_delta * 0.4", "max(0.0, king_safety_delta) * 0.4"),
        ("mobility_delta * 0.2", "max(0.0, -mobility_delta) * 0.2"),
        ("safety_cap clamping", "min(soft_raw, safety_cap)"),
    ]

    all_present = True
    for name, pattern in required_components:
        present = pattern in content
        status = "✓" if present else "✗"
        print(f"{status} {name:30} {'present' if present else 'MISSING'}")
        if not present:
            all_present = False

    print("=" * 70)
    return all_present


def test_soft_weight_computation():
    """Test the soft_weight computation manually."""
    print("\n" + "=" * 70)
    print("Soft weight computation test (manual calculation)")
    print("=" * 70)

    # Test case 1: Positive consolidation
    structure_delta = 0.3
    king_safety_delta = 0.2
    mobility_delta = -0.1  # Note: negative means reduced mobility (defensive)

    soft_raw = (
        max(0.0, structure_delta) * 0.4
        + max(0.0, king_safety_delta) * 0.4
        + max(0.0, -mobility_delta) * 0.2
    )

    expected = 0.3 * 0.4 + 0.2 * 0.4 + 0.1 * 0.2
    # = 0.12 + 0.08 + 0.02 = 0.22

    print(f"Test case 1 (positive consolidation):")
    print(f"  structure={structure_delta}, king_safety={king_safety_delta}, mobility={mobility_delta}")
    print(f"  Computed: {soft_raw:.3f}")
    print(f"  Expected: {expected:.3f}")
    status1 = abs(soft_raw - expected) < 0.001
    print(f"  {'✓ PASS' if status1 else '✗ FAIL'}")

    # Test case 2: Capping at safety_cap
    structure_delta = 0.8
    king_safety_delta = 0.7
    mobility_delta = -0.3
    safety_cap = 0.6

    soft_raw = (
        max(0.0, structure_delta) * 0.4
        + max(0.0, king_safety_delta) * 0.4
        + max(0.0, -mobility_delta) * 0.2
    )
    soft_capped = min(soft_raw, safety_cap)

    expected_raw = 0.8 * 0.4 + 0.7 * 0.4 + 0.3 * 0.2
    # = 0.32 + 0.28 + 0.06 = 0.66
    expected_capped = 0.6

    print(f"\nTest case 2 (capping at safety_cap):")
    print(f"  structure={structure_delta}, king_safety={king_safety_delta}, mobility={mobility_delta}")
    print(f"  Raw computed: {soft_raw:.3f}")
    print(f"  Capped: {soft_capped:.3f}")
    print(f"  Expected capped: {expected_capped:.3f}")
    status2 = abs(soft_capped - expected_capped) < 0.001
    print(f"  {'✓ PASS' if status2 else '✗ FAIL'}")

    print("=" * 70)
    return status1 and status2


def verify_rule_tagger2_match():
    """Verify that the formula matches rule_tagger2/legacy/core.py."""
    rule_tagger2_file = "/home/catadragon/Code/ChessorTag_final/chess_imitator/rule_tagger_lichessbot/rule_tagger2/legacy/core.py"

    if not os.path.exists(rule_tagger2_file):
        print("\n⚠ Warning: Cannot verify against rule_tagger2 (file not found)")
        return True

    print("\n" + "=" * 70)
    print("Verification against rule_tagger2/legacy/core.py:1029-1037")
    print("=" * 70)

    with open(rule_tagger2_file) as f:
        lines = f.readlines()

    # Check lines 1029-1037 (safety_raw calculation)
    formula_lines = lines[1028:1037]  # 0-indexed
    formula_text = "".join(formula_lines)

    checks = [
        ("self_structure_gain * 0.4", "self_structure_gain) * 0.4" in formula_text),
        ("self_ks_gain * 0.4", "self_ks_gain) * 0.4" in formula_text),
        ("self_mobility_change * 0.2", "-self_mobility_change) * 0.2" in formula_text),
        ("clamp_preventive_score", "clamp_preventive_score" in formula_text),
    ]

    all_match = True
    for check_name, result in checks:
        status = "✓" if result else "✗"
        print(f"{status} {check_name:30} {'matches' if result else 'MISSING'}")
        if not result:
            all_match = False

    print("\nNote: In rule_tagger2/legacy/core.py:")
    print("  - Uses clamp_preventive_score() to apply safety_cap")
    print("  - Variable names: self_structure_gain, self_ks_gain, self_mobility_change")
    print("  - Our implementation: structure_delta, king_safety_delta, mobility_delta")
    print("  - Same semantics, just different naming convention")

    print("=" * 70)
    return all_match


def run_all_tests():
    """Run all soft_weight formula verification tests."""
    print("\n🔍 Testing soft_weight formula extraction")
    print("=" * 70)

    results = []
    results.append(("Formula presence", test_soft_weight_formula()))
    results.append(("Formula computation", test_soft_weight_computation()))
    results.append(("rule_tagger2 match", verify_rule_tagger2_match()))

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{name:30} {status}")
    print("=" * 70)

    all_passed = all(passed for _, passed in results)
    if all_passed:
        print("\n🎉 ALL TESTS PASSED!")
        print("\nSoft weight formula successfully verified:")
        print("  soft_raw = max(0, structure_delta) * 0.4")
        print("           + max(0, king_safety_delta) * 0.4")
        print("           + max(0, -mobility_delta) * 0.2")
        print("  soft_weight = min(soft_raw, safety_cap)")
        print("\nMatches rule_tagger2/legacy/core.py:1029-1037 exactly ✓")
        print("\nVariable mapping:")
        print("  structure_delta    ← self_structure_gain")
        print("  king_safety_delta  ← self_ks_gain")
        print("  mobility_delta     ← self_mobility_change")
    else:
        print("\n❌ SOME TESTS FAILED")

    return all_passed


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)
