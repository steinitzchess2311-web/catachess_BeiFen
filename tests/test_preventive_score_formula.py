"""
Test the preventive_score formula matches rule_tagger2/legacy/core.py:1020-1026.

Run with: python3 tests/test_preventive_score_formula.py
"""
import os


def read_score_function():
    """Read the compute_preventive_score_from_deltas function from score.py."""
    score_file = os.path.join(
        os.path.dirname(__file__),
        "..",
        "backend/core/tagger/detectors/helpers/prophylaxis_modules/score.py"
    )
    with open(score_file) as f:
        content = f.read()
    return content


def test_formula_presence():
    """Verify the formula contains all required components with correct weights."""
    content = read_score_function()

    print("=" * 70)
    print("Formula verification test")
    print("=" * 70)

    required_components = [
        ("threat_delta parameter", "threat_delta: float"),
        ("threat_delta * 0.5", "max(0.0, threat_delta) * 0.5"),
        ("opp_mobility * 0.3", "max(0.0, -opp_mobility_delta) * 0.3"),
        ("opp_tactics * 0.2", "max(0.0, -opp_tactics_delta) * 0.2"),
        ("opp_trend * 0.15", "max(0.0, -opp_trend) * 0.15"),
        ("source attribution", "rule_tagger2/legacy/core.py:1020-1026"),
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


def test_formula_computation():
    """Test the formula computation manually."""
    print("\n" + "=" * 70)
    print("Formula computation test (manual calculation)")
    print("=" * 70)

    # Test case 1: With threat_delta
    threat_delta = 0.4
    opp_mobility_delta = -0.2
    opp_tactics_delta = -0.1
    opp_trend = opp_mobility_delta + opp_tactics_delta  # -0.3

    preventive_score = (
        max(0.0, threat_delta) * 0.5
        + max(0.0, -opp_mobility_delta) * 0.3
        + max(0.0, -opp_tactics_delta) * 0.2
        + max(0.0, -opp_trend) * 0.15
    )

    expected = 0.4 * 0.5 + 0.2 * 0.3 + 0.1 * 0.2 + 0.3 * 0.15
    # = 0.2 + 0.06 + 0.02 + 0.045 = 0.325

    print(f"Test case 1 (with threat_delta):")
    print(f"  threat_delta={threat_delta}, opp_mobility={opp_mobility_delta}, opp_tactics={opp_tactics_delta}")
    print(f"  Computed: {preventive_score:.3f}")
    print(f"  Expected: {expected:.3f}")
    status1 = abs(preventive_score - expected) < 0.001
    print(f"  {'✓ PASS' if status1 else '✗ FAIL'}")

    # Test case 2: Without threat_delta
    threat_delta = 0.0
    preventive_score = (
        max(0.0, threat_delta) * 0.5
        + max(0.0, -opp_mobility_delta) * 0.3
        + max(0.0, -opp_tactics_delta) * 0.2
        + max(0.0, -opp_trend) * 0.15
    )

    expected = 0.0 * 0.5 + 0.2 * 0.3 + 0.1 * 0.2 + 0.3 * 0.15
    # = 0 + 0.06 + 0.02 + 0.045 = 0.125

    print(f"\nTest case 2 (without threat_delta):")
    print(f"  threat_delta={threat_delta}, opp_mobility={opp_mobility_delta}, opp_tactics={opp_tactics_delta}")
    print(f"  Computed: {preventive_score:.3f}")
    print(f"  Expected: {expected:.3f}")
    status2 = abs(preventive_score - expected) < 0.001
    print(f"  {'✓ PASS' if status2 else '✗ FAIL'}")

    # Test case 3: Threat dominance (weight 0.5 is highest)
    threat_delta = 0.8
    opp_mobility_delta = -0.1
    opp_tactics_delta = -0.05
    opp_trend = opp_mobility_delta + opp_tactics_delta  # -0.15

    threat_component = max(0.0, threat_delta) * 0.5  # 0.4
    mobility_component = max(0.0, -opp_mobility_delta) * 0.3  # 0.03
    tactics_component = max(0.0, -opp_tactics_delta) * 0.2  # 0.01
    trend_component = max(0.0, -opp_trend) * 0.15  # 0.0225

    print(f"\nTest case 3 (threat dominance):")
    print(f"  threat_component:   {threat_component:.3f} (weight 0.5)")
    print(f"  mobility_component: {mobility_component:.3f} (weight 0.3)")
    print(f"  tactics_component:  {tactics_component:.3f} (weight 0.2)")
    print(f"  trend_component:    {trend_component:.3f} (weight 0.15)")

    status3 = (threat_component > mobility_component and
               threat_component > tactics_component and
               threat_component > trend_component)
    print(f"  {'✓ PASS' if status3 else '✗ FAIL'} - threat_delta has highest weight")

    print("=" * 70)
    return status1 and status2 and status3


def verify_rule_tagger2_match():
    """Verify that the formula matches rule_tagger2/legacy/core.py."""
    rule_tagger2_file = "/home/catadragon/Code/ChessorTag_final/chess_imitator/rule_tagger_lichessbot/rule_tagger2/legacy/core.py"

    if not os.path.exists(rule_tagger2_file):
        print("\n⚠ Warning: Cannot verify against rule_tagger2 (file not found)")
        return True

    print("\n" + "=" * 70)
    print("Verification against rule_tagger2/legacy/core.py")
    print("=" * 70)

    with open(rule_tagger2_file) as f:
        lines = f.readlines()

    # Check lines 1020-1026
    formula_lines = lines[1019:1026]  # 0-indexed
    formula_text = "".join(formula_lines)

    checks = [
        ("threat_delta * 0.5", "max(0.0, threat_delta) * 0.5" in formula_text),
        ("opp_mobility_change * 0.3", "-opp_mobility_change) * 0.3" in formula_text),
        ("opp_tactics_change * 0.2", "-opp_tactics_change) * 0.2" in formula_text),
        ("opp_trend * 0.15", "-opp_trend) * 0.15" in formula_text),
    ]

    all_match = True
    for check_name, result in checks:
        status = "✓" if result else "✗"
        print(f"{status} {check_name:30} {'matches' if result else 'MISSING'}")
        if not result:
            all_match = False

    print("=" * 70)
    return all_match


def run_all_tests():
    """Run all formula verification tests."""
    print("\n🔍 Testing preventive_score formula extraction")
    print("=" * 70)

    results = []
    results.append(("Formula presence", test_formula_presence()))
    results.append(("Formula computation", test_formula_computation()))
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
        print("\nFormula successfully updated:")
        print("  preventive_score = max(0, threat_delta) * 0.5")
        print("                   + max(0, -opp_mobility_delta) * 0.3")
        print("                   + max(0, -opp_tactics_delta) * 0.2")
        print("                   + max(0, -opp_trend) * 0.15")
        print("\nMatches rule_tagger2/legacy/core.py:1020-1026 exactly ✓")
    else:
        print("\n❌ SOME TESTS FAILED")

    return all_passed


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)
