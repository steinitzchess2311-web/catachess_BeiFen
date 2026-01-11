"""
Test prophylaxis tag suppression logic.

Verifies that quality tags (direct/latent/meaningless) suppress
generic prophylactic_move tag, matching rule_tagger2 behavior.

Reference: rule_tagger2/legacy/core.py:2314-2317
"""
import sys
import os

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.core.tagger.tagging.suppression import suppress_conflicts


def test_prophylaxis_direct_suppresses_move():
    """When direct is detected, prophylactic_move should be suppressed."""
    tags = ["prophylactic_direct", "prophylactic_move"]
    kept, suppressed = suppress_conflicts(tags)

    assert "prophylactic_direct" in kept, "prophylactic_direct should be kept"
    assert "prophylactic_move" not in kept, "prophylactic_move should be suppressed"
    assert "prophylactic_move" in suppressed, "prophylactic_move should be in suppressed list"

    print("✅ Test 1 passed: direct suppresses move")


def test_prophylaxis_latent_suppresses_move():
    """When latent is detected, prophylactic_move should be suppressed."""
    tags = ["prophylactic_latent", "prophylactic_move"]
    kept, suppressed = suppress_conflicts(tags)

    assert "prophylactic_latent" in kept, "prophylactic_latent should be kept"
    assert "prophylactic_move" not in kept, "prophylactic_move should be suppressed"
    assert "prophylactic_move" in suppressed, "prophylactic_move should be in suppressed list"

    print("✅ Test 2 passed: latent suppresses move")


def test_prophylaxis_meaningless_suppresses_move():
    """When meaningless is detected, prophylactic_move should be suppressed."""
    tags = ["prophylactic_meaningless", "prophylactic_move"]
    kept, suppressed = suppress_conflicts(tags)

    assert "prophylactic_meaningless" in kept, "prophylactic_meaningless should be kept"
    assert "prophylactic_move" not in kept, "prophylactic_move should be suppressed"
    assert "prophylactic_move" in suppressed, "prophylactic_move should be in suppressed list"

    print("✅ Test 3 passed: meaningless suppresses move")


def test_prophylaxis_move_alone_not_suppressed():
    """When only prophylactic_move is detected, it should NOT be suppressed."""
    tags = ["prophylactic_move"]
    kept, suppressed = suppress_conflicts(tags)

    assert "prophylactic_move" in kept, "prophylactic_move should be kept when alone"
    assert "prophylactic_move" not in suppressed, "prophylactic_move should not be suppressed"

    print("✅ Test 4 passed: move alone is not suppressed")


def test_prophylaxis_direct_preferred_over_latent():
    """Direct should suppress latent (higher in hierarchy)."""
    tags = ["prophylactic_direct", "prophylactic_latent", "prophylactic_move"]
    kept, suppressed = suppress_conflicts(tags)

    assert "prophylactic_direct" in kept, "prophylactic_direct should be kept"
    assert "prophylactic_latent" not in kept, "prophylactic_latent should be suppressed"
    assert "prophylactic_move" not in kept, "prophylactic_move should be suppressed"

    assert "prophylactic_latent" in suppressed
    assert "prophylactic_move" in suppressed

    print("✅ Test 5 passed: direct > latent > move hierarchy works")


def test_prophylaxis_latent_preferred_over_meaningless():
    """Latent should suppress meaningless (higher in hierarchy)."""
    tags = ["prophylactic_latent", "prophylactic_meaningless", "prophylactic_move"]
    kept, suppressed = suppress_conflicts(tags)

    assert "prophylactic_latent" in kept, "prophylactic_latent should be kept"
    assert "prophylactic_meaningless" not in kept, "prophylactic_meaningless should be suppressed"
    assert "prophylactic_move" not in kept, "prophylactic_move should be suppressed"

    assert "prophylactic_meaningless" in suppressed
    assert "prophylactic_move" in suppressed

    print("✅ Test 6 passed: latent > meaningless > move hierarchy works")


def test_prophylaxis_with_other_tags():
    """Prophylaxis suppression should not affect other tags."""
    tags = [
        "prophylactic_direct",
        "prophylactic_move",
        "initiative_exploitation",
        "tactical_sensitivity"
    ]
    kept, suppressed = suppress_conflicts(tags)

    assert "prophylactic_direct" in kept
    assert "prophylactic_move" not in kept
    assert "initiative_exploitation" in kept
    assert "tactical_sensitivity" in kept

    print("✅ Test 7 passed: prophylaxis suppression doesn't affect other tags")


def test_rule_tagger2_equivalence_scenarios():
    """
    Test all 4 scenarios from monitoring report:

    1. direct=True, move=True  → Output: direct=True, move=False
    2. latent=True, move=True  → Output: latent=True, move=False
    3. meaningless=True, move=True → Output: meaningless=True, move=False
    4. move=True only → Output: move=True
    """
    # Scenario 1: direct + move
    kept, _ = suppress_conflicts(["prophylactic_direct", "prophylactic_move"])
    assert kept == ["prophylactic_direct"], f"Scenario 1 failed: {kept}"

    # Scenario 2: latent + move
    kept, _ = suppress_conflicts(["prophylactic_latent", "prophylactic_move"])
    assert kept == ["prophylactic_latent"], f"Scenario 2 failed: {kept}"

    # Scenario 3: meaningless + move
    kept, _ = suppress_conflicts(["prophylactic_meaningless", "prophylactic_move"])
    assert kept == ["prophylactic_meaningless"], f"Scenario 3 failed: {kept}"

    # Scenario 4: move only
    kept, _ = suppress_conflicts(["prophylactic_move"])
    assert kept == ["prophylactic_move"], f"Scenario 4 failed: {kept}"

    print("✅ Test 8 passed: All 4 rule_tagger2 equivalence scenarios work")


def run_all_tests():
    """Run all prophylaxis suppression tests."""
    print("\n" + "="*70)
    print("Testing Prophylaxis Suppression Logic")
    print("="*70 + "\n")

    try:
        test_prophylaxis_direct_suppresses_move()
        test_prophylaxis_latent_suppresses_move()
        test_prophylaxis_meaningless_suppresses_move()
        test_prophylaxis_move_alone_not_suppressed()
        test_prophylaxis_direct_preferred_over_latent()
        test_prophylaxis_latent_preferred_over_meaningless()
        test_prophylaxis_with_other_tags()
        test_rule_tagger2_equivalence_scenarios()

        print("\n" + "="*70)
        print("✅ ALL TESTS PASSED - Prophylaxis suppression matches rule_tagger2!")
        print("="*70 + "\n")
        return True

    except AssertionError as e:
        print("\n" + "="*70)
        print(f"❌ TEST FAILED: {e}")
        print("="*70 + "\n")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
