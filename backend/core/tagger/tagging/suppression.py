"""
Tag suppression logic for handling conflicting tags.
Each hierarchy enforces mutual exclusivity within tag groups.
"""
from typing import List, Set, Tuple

from . import prioritize_tags


def suppress_conflicts(tags: List[str]) -> Tuple[List[str], List[str]]:
    """
    Apply all suppression rules and return (kept_tags, suppressed_tags).
    """
    kept = set(tags)
    suppressed = []

    # Apply each hierarchy rule
    suppressed.extend(_suppress_maneuver_conflicts(kept))
    suppressed.extend(_suppress_tension_conflicts(kept))
    suppressed.extend(_suppress_initiative_conflicts(kept))
    suppressed.extend(_suppress_sacrifice_conflicts(kept))
    suppressed.extend(_suppress_prophylaxis_conflicts(kept))
    suppressed.extend(_suppress_structure_conflicts(kept))
    suppressed.extend(_suppress_exchange_conflicts(kept))

    return prioritize_tags(list(kept)), suppressed


def _suppress_maneuver_conflicts(kept: Set[str]) -> List[str]:
    """Maneuver hierarchy: constructive > prepare > neutral > misplaced."""
    maneuver_hierarchy = [
        "constructive_maneuver",
        "constructive_maneuver_prepare",
        "neutral_maneuver",
        "misplaced_maneuver",
    ]
    return _suppress_by_hierarchy(kept, maneuver_hierarchy)


def _suppress_tension_conflicts(kept: Set[str]) -> List[str]:
    """Tension hierarchy: tension_creation > neutral_tension_creation."""
    if "tension_creation" in kept and "neutral_tension_creation" in kept:
        kept.discard("neutral_tension_creation")
        return ["neutral_tension_creation"]
    return []


def _suppress_initiative_conflicts(kept: Set[str]) -> List[str]:
    """Initiative hierarchy: exploitation > attempt."""
    if "initiative_exploitation" in kept and "initiative_attempt" in kept:
        kept.discard("initiative_attempt")
        return ["initiative_attempt"]
    return []


def _suppress_sacrifice_conflicts(kept: Set[str]) -> List[str]:
    """Sacrifice hierarchy: keep only highest priority."""
    sacrifice_hierarchy = [
        "tactical_sacrifice",
        "tactical_combination_sacrifice",
        "tactical_initiative_sacrifice",
        "positional_sacrifice",
        "positional_structure_sacrifice",
        "positional_space_sacrifice",
        "inaccurate_tactical_sacrifice",
        "speculative_sacrifice",
        "desperate_sacrifice",
    ]
    return _suppress_by_hierarchy(kept, sacrifice_hierarchy)


def _suppress_prophylaxis_conflicts(kept: Set[str]) -> List[str]:
    """
    Prophylaxis hierarchy: direct > latent > meaningless > move.

    Matches rule_tagger2/legacy/core.py:2314-2317 behavior:
    Quality tags (direct/latent/meaningless) suppress generic prophylactic_move.
    This prevents noise from both quality-specific and generic tags firing simultaneously.
    """
    prophy_hierarchy = [
        "prophylactic_direct",
        "prophylactic_latent",
        "prophylactic_meaningless",
        "prophylactic_move",  # Generic tag suppressed by quality tags
    ]
    return _suppress_by_hierarchy(kept, prophy_hierarchy)


def _suppress_structure_conflicts(kept: Set[str]) -> List[str]:
    """Structure hierarchy: dynamic > static."""
    if "structural_compromise_dynamic" in kept and "structural_compromise_static" in kept:
        kept.discard("structural_compromise_static")
        return ["structural_compromise_static"]
    return []


def _suppress_exchange_conflicts(kept: Set[str]) -> List[str]:
    """Knight-Bishop exchange: accurate > inaccurate > bad."""
    kbe_hierarchy = [
        "accurate_knight_bishop_exchange",
        "inaccurate_knight_bishop_exchange",
        "bad_knight_bishop_exchange",
    ]
    return _suppress_by_hierarchy(kept, kbe_hierarchy)


def _suppress_by_hierarchy(kept: Set[str], hierarchy: List[str]) -> List[str]:
    """
    Keep only the highest priority tag from hierarchy.
    Returns list of suppressed tags.
    """
    present = [tag for tag in hierarchy if tag in kept]
    if len(present) > 1:
        # Keep first (highest priority), suppress rest
        to_suppress = present[1:]
        for tag in to_suppress:
            kept.discard(tag)
        return to_suppress
    return []


__all__ = ["suppress_conflicts"]
