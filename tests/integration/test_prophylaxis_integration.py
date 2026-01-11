"""
Stage 5: End-to-End Integration Testing for Prophylaxis Detection.

This test suite requires:
1. Catachess tagger pipeline fully set up
2. Chess engine (Stockfish) installed and accessible
3. TagContext properly populated with all required fields

Run with: pytest tests/integration/test_prophylaxis_integration.py -v

Status: TEMPLATE - Requires actual runtime environment
"""
import json
import os
import pytest
from typing import Dict, Any, List

# These imports will work once the full catachess pipeline is set up
try:
    from backend.core.tagger.facade import tag_position
    from backend.core.tagger.models import TagContext, TagEvidence
    from backend.core.tagger.detectors.prophylaxis import (
        detect_prophylactic_move,
        detect_prophylactic_direct,
        detect_prophylactic_latent,
        detect_prophylactic_meaningless,
    )
    import chess
    IMPORTS_AVAILABLE = True
except ImportError as e:
    IMPORTS_AVAILABLE = False
    IMPORT_ERROR = str(e)


def load_test_positions() -> List[Dict[str, Any]]:
    """Load test positions from JSON fixture file."""
    fixture_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "fixtures",
        "prophylaxis_positions.json"
    )
    with open(fixture_path) as f:
        return json.load(f)


@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason=f"Imports not available: {IMPORT_ERROR if not IMPORTS_AVAILABLE else ''}")
class TestProphylaxisIntegration:
    """Integration tests for prophylaxis detection pipeline."""

    @pytest.fixture
    def test_positions(self):
        """Fixture providing test positions."""
        return load_test_positions()

    def create_tag_context(self, position: Dict[str, Any]) -> TagContext:
        """
        Create TagContext from test position.

        In actual implementation, this would:
        1. Parse FEN to create board
        2. Apply played_move
        3. Run engine analysis for both positions
        4. Compute all component deltas
        5. Populate all TagContext fields

        TODO: Implement full context creation once engine integration is ready.
        """
        board_before = chess.Board(position["fen"])
        played_move = chess.Move.from_uci(position["played_move"])

        # Placeholder - in real implementation, compute all these values
        ctx = TagContext()
        ctx.board_before = board_before
        ctx.played_move = played_move
        ctx.delta_eval = 0.0  # TODO: Compute from engine
        ctx.component_deltas = {}  # TODO: Compute metrics
        ctx.opp_component_deltas = {}  # TODO: Compute opponent metrics
        ctx.threat_delta = 0.0  # TODO: Compute via estimate_opponent_threat()

        return ctx

    def test_prophylactic_direct_positions(self, test_positions):
        """Test positions that should trigger prophylactic_direct."""
        direct_positions = [p for p in test_positions if p["category"] == "prophylactic_direct"]

        for position in direct_positions:
            ctx = self.create_tag_context(position)
            result = detect_prophylactic_direct(ctx)

            assert result.fired, f"Expected prophylactic_direct to fire for {position['id']}: {position['description']}"
            assert result.confidence >= position.get("expected_confidence_min", 0.75), \
                f"Confidence {result.confidence} below minimum for {position['id']}"
            assert "prophylactic_direct" in position["expected_tags"]

    def test_prophylactic_latent_positions(self, test_positions):
        """Test positions that should trigger prophylactic_latent."""
        latent_positions = [p for p in test_positions if p["category"] == "prophylactic_latent"]

        for position in latent_positions:
            ctx = self.create_tag_context(position)
            result = detect_prophylactic_latent(ctx)

            assert result.fired, f"Expected prophylactic_latent to fire for {position['id']}: {position['description']}"

            min_conf = position.get("expected_confidence_min", 0.45)
            max_conf = position.get("expected_confidence_max", 0.75)
            assert min_conf <= result.confidence <= max_conf, \
                f"Confidence {result.confidence} outside range [{min_conf}, {max_conf}] for {position['id']}"

    def test_prophylactic_meaningless_positions(self, test_positions):
        """Test positions that should trigger prophylactic_meaningless."""
        meaningless_positions = [p for p in test_positions if p["category"] == "prophylactic_meaningless"]

        for position in meaningless_positions:
            ctx = self.create_tag_context(position)
            result = detect_prophylactic_meaningless(ctx)

            assert result.fired, f"Expected prophylactic_meaningless to fire for {position['id']}: {position['description']}"
            assert result.confidence >= position.get("expected_confidence_min", 0.60)

            # Verify eval drop is significant
            if "expected_eval_drop" in position:
                assert ctx.delta_eval * 100 <= position["expected_eval_drop"], \
                    f"Expected eval drop <= {position['expected_eval_drop']}cp"

    def test_non_prophylactic_positions(self, test_positions):
        """Test positions that should NOT trigger any prophylaxis tags."""
        non_prophy_positions = [p for p in test_positions if p["category"] == "non_prophylactic"]

        for position in non_prophy_positions:
            ctx = self.create_tag_context(position)

            move_result = detect_prophylactic_move(ctx)
            direct_result = detect_prophylactic_direct(ctx)
            latent_result = detect_prophylactic_latent(ctx)
            meaningless_result = detect_prophylactic_meaningless(ctx)

            assert not move_result.fired, f"prophylactic_move should not fire for {position['id']}"
            assert not direct_result.fired, f"prophylactic_direct should not fire for {position['id']}"
            assert not latent_result.fired, f"prophylactic_latent should not fire for {position['id']}"
            assert not meaningless_result.fired, f"prophylactic_meaningless should not fire for {position['id']}"

    def test_filtered_candidate_positions(self, test_positions):
        """Test positions that should be filtered by is_prophylaxis_candidate()."""
        filtered_positions = [p for p in test_positions if p["category"] == "filtered_candidate"]

        for position in filtered_positions:
            ctx = self.create_tag_context(position)
            result = detect_prophylactic_move(ctx)

            assert not result.fired, f"Move should be filtered for {position['id']}"
            assert "candidate" in result.gates_failed, \
                f"Expected 'candidate' gate to fail for {position['id']}: {position['description']}"

    def test_pattern_detection(self, test_positions):
        """Test pattern detection (bishop retreat, knight reposition, king shuffle)."""
        pattern_positions = [p for p in test_positions if p["category"] == "pattern_detection"]

        for position in pattern_positions:
            ctx = self.create_tag_context(position)
            result = detect_prophylactic_move(ctx)

            assert result.fired, f"Pattern-based prophylaxis should fire for {position['id']}"

            if "expected_pattern" in position:
                assert result.evidence.get("pattern_support") == position["expected_pattern"], \
                    f"Expected pattern '{position['expected_pattern']}' for {position['id']}"

    def test_edge_cases(self, test_positions):
        """Test edge cases (full material, no piece, etc.)."""
        edge_positions = [p for p in test_positions if p["category"] == "edge_case"]

        for position in edge_positions:
            ctx = self.create_tag_context(position)

            # Should not crash and should handle gracefully
            try:
                result = detect_prophylactic_move(ctx)
                # Most edge cases should be filtered
                if "expected_gates_failed" in position:
                    for gate in position["expected_gates_failed"]:
                        assert gate in result.gates_failed, \
                            f"Expected gate '{gate}' to fail for {position['id']}"
            except Exception as e:
                pytest.fail(f"Edge case {position['id']} crashed: {e}")

    def test_confidence_ranges(self, test_positions):
        """Verify confidence values are within expected ranges."""
        for position in test_positions:
            if "expected_confidence_min" not in position:
                continue

            ctx = self.create_tag_context(position)

            # Run appropriate detector based on category
            if position["category"] == "prophylactic_direct":
                result = detect_prophylactic_direct(ctx)
            elif position["category"] == "prophylactic_latent":
                result = detect_prophylactic_latent(ctx)
            elif position["category"] == "prophylactic_meaningless":
                result = detect_prophylactic_meaningless(ctx)
            else:
                continue

            if result.fired:
                min_conf = position["expected_confidence_min"]
                max_conf = position.get("expected_confidence_max", 1.0)

                assert min_conf <= result.confidence <= max_conf, \
                    f"Confidence {result.confidence} outside range [{min_conf}, {max_conf}] for {position['id']}"

    @pytest.mark.parametrize("position", load_test_positions())
    def test_each_position_individually(self, position):
        """Test each position individually for detailed diagnostics."""
        if not IMPORTS_AVAILABLE:
            pytest.skip("Imports not available")

        ctx = self.create_tag_context(position)

        # Run all detectors
        move_result = detect_prophylactic_move(ctx)
        direct_result = detect_prophylactic_direct(ctx)
        latent_result = detect_prophylactic_latent(ctx)
        meaningless_result = detect_prophylactic_meaningless(ctx)

        # Print diagnostic info
        print(f"\n{'='*70}")
        print(f"Position: {position['id']} - {position['category']}")
        print(f"Description: {position['description']}")
        print(f"FEN: {position['fen']}")
        print(f"Move: {position['played_move']}")
        print(f"\nResults:")
        print(f"  prophylactic_move: {move_result.fired} (conf: {move_result.confidence:.3f})")
        print(f"  prophylactic_direct: {direct_result.fired} (conf: {direct_result.confidence:.3f})")
        print(f"  prophylactic_latent: {latent_result.fired} (conf: {latent_result.confidence:.3f})")
        print(f"  prophylactic_meaningless: {meaningless_result.fired} (conf: {meaningless_result.confidence:.3f})")
        print(f"\nExpected tags: {position.get('expected_tags', [])}")
        print(f"{'='*70}")


@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Imports not available")
def test_load_positions_fixture():
    """Test that the positions fixture file loads correctly."""
    positions = load_test_positions()

    assert len(positions) > 0, "No test positions loaded"
    assert len(positions) == 16, f"Expected 16 positions, got {len(positions)}"

    # Verify structure
    required_fields = ["id", "category", "fen", "played_move", "description"]
    for position in positions:
        for field in required_fields:
            assert field in position, f"Position {position.get('id', 'unknown')} missing field '{field}'"

    # Count categories
    categories = {}
    for position in positions:
        cat = position["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\nTest position categories:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count} positions")


if __name__ == "__main__":
    # Run with: python -m pytest tests/integration/test_prophylaxis_integration.py -v -s
    if IMPORTS_AVAILABLE:
        print("✅ All imports successful - ready for integration testing")
    else:
        print(f"⚠️ Imports not available: {IMPORT_ERROR}")
        print("\nTo run integration tests, ensure:")
        print("  1. Backend imports work (chess, TagContext, etc.)")
        print("  2. Engine is installed and accessible")
        print("  3. Full tagger pipeline is set up")
