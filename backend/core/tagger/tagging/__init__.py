"""
Tag assembly and result building.

This module handles the final assembly of detected tags into structured results,
applying priority rules and suppression logic.
"""
from typing import Dict, List, Tuple, Any

from ..tag_result import TagResult


# Tag priority mapping (lower = higher priority)
TAG_PRIORITY = {
    "initiative_exploitation": 1,
    "initiative_attempt": 2,
    "file_pressure_c": 3,
    "tension_creation": 4,
    "neutral_tension_creation": 5,
    "premature_attack": 6,
    "constructive_maneuver": 7,
    "constructive_maneuver_prepare": 7,
    "neutral_maneuver": 8,
    "misplaced_maneuver": 9,
    "maneuver_opening": 9,
    "opening_central_pawn_move": 9,
    "opening_rook_pawn_move": 9,
    "tactical_sacrifice": 10,
    "positional_sacrifice": 10,
    "prophylactic_move": 10,
    "inaccurate_tactical_sacrifice": 11,
    "prophylactic_direct": 10,
    "prophylactic_latent": 11,
    "prophylactic_meaningless": 12,
    "failed_prophylactic": 12,
    "speculative_sacrifice": 12,
    "desperate_sacrifice": 13,
    "tactical_combination_sacrifice": 14,
    "tactical_initiative_sacrifice": 14,
    "positional_structure_sacrifice": 15,
    "positional_space_sacrifice": 15,
    "control_over_dynamics": 14,
    "deferred_initiative": 15,
    "risk_avoidance": 16,
    "structural_compromise_dynamic": 17,
    "structural_compromise_static": 18,
    "structural_integrity": 19,
    "accurate_knight_bishop_exchange": 20,
    "tactical_sensitivity": 20,
    "inaccurate_knight_bishop_exchange": 21,
    "first_choice": 21,
    "bad_knight_bishop_exchange": 22,
    "missed_tactic": 22,
    "conversion_precision": 23,
    "panic_move": 24,
    "tactical_recovery": 25,
}


def get_primary_tags(result: TagResult) -> List[str]:
    """Extract all fired boolean tags from TagResult."""
    tags = []
    for field, value in vars(result).items():
        if isinstance(value, bool) and value:
            tags.append(field)
    return tags


def prioritize_tags(tags: List[str]) -> List[str]:
    """Sort tags by priority (highest priority first)."""
    return sorted(tags, key=lambda t: TAG_PRIORITY.get(t, 999))


def apply_suppression_rules(tags: List[str]) -> Tuple[List[str], List[str]]:
    """
    Apply tag suppression rules to remove conflicting tags.

    Returns (kept_tags, suppressed_tags).
    """
    from .suppression import suppress_conflicts
    return suppress_conflicts(tags)


def assemble_tag_dict(result: TagResult) -> Dict[str, Any]:
    """Assemble dictionary representation of tag results."""
    all_tags = get_primary_tags(result)
    primary_tags, suppressed_tags = apply_suppression_rules(all_tags)

    return {
        "primary_tags": primary_tags,
        "secondary_tags": [],
        "suppressed_tags": suppressed_tags,
        "mode": result.mode,
        "evaluation": {
            "before": result.eval_before,
            "played": result.eval_played,
            "best": result.eval_best,
            "delta": result.delta_eval,
        },
        "moves": {
            "played": result.played_move,
            "played_kind": result.played_kind,
            "best": result.best_move,
            "best_kind": result.best_kind,
        },
        "metrics": {
            "tactical_weight": result.tactical_weight,
            "coverage_delta": result.coverage_delta,
            "prophylaxis_score": result.prophylaxis_score,
        },
        "analysis_context": result.analysis_context,
    }


__all__ = [
    "TAG_PRIORITY",
    "get_primary_tags",
    "prioritize_tags",
    "apply_suppression_rules",
    "assemble_tag_dict",
]
