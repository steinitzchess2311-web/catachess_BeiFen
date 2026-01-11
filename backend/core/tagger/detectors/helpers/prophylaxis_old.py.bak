"""
Prophylaxis detection helpers.

This module provides helper functions for detecting prophylactic moves -
anticipatory moves that prevent opponent threats or restrict opponent play.

Migrated from rule_tagger2/legacy/prophylaxis.py with exact threshold matching.

Key concepts:
- Prophylaxis is anticipatory, not reactive (no captures, checks, or responses to check)
- Preventive score: measures opponent restriction (mobility drop, tactics drop, threat reduction)
- Soft weight: measures positional consolidation (structure, king safety)
- Pattern support: canonical prophylaxis motifs (bishop retreat, knight reposition, etc.)

Functions:
- ProphylaxisConfig: Configuration dataclass with all thresholds
- is_prophylaxis_candidate(): Gate to check eligibility
- compute_preventive_score(): Compute opponent restriction score
- compute_soft_weight(): Compute positional consolidation score
- prophylaxis_pattern_reason(): Detect canonical motifs
- is_full_material(): Check if all 32 pieces remain
- estimate_opponent_threat(): Engine-based threat estimation
- clamp_preventive_score(): Clamp score to safety bounds
- classify_prophylaxis_quality(): Classify prophylaxis quality (direct/latent/meaningless)
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple
import chess
import chess.engine
from backend.core.tagger.models import TagContext

# Constants
FULL_MATERIAL_COUNT = 32
OPENING_MOVE_CUTOFF = 6  # Only block prophylaxis if fullmove < 6 AND all pieces present


@dataclass(frozen=True)
class ProphylaxisConfig:
    """
    Configuration for prophylaxis detection thresholds.

    All default values match rule_tagger2/legacy/prophylaxis.py exactly.

    Attributes:
        structure_min: Minimum structure improvement to count towards preventive score
        opp_mobility_drop: Threshold for opponent mobility restriction
        self_mobility_tol: Maximum self-mobility penalty tolerance
        preventive_trigger: Minimum preventive score to qualify as prophylaxis
        safety_cap: Maximum preventive score cap
        score_threshold: Minimum score for direct prophylaxis classification
        threat_depth: Engine depth for threat estimation (will be maxed with 8)
        threat_drop: Threshold for significant threat reduction
    """
    structure_min: float = 0.2
    opp_mobility_drop: float = 0.15
    self_mobility_tol: float = 0.3
    preventive_trigger: float = 0.16
    safety_cap: float = 0.6
    score_threshold: float = 0.20
    threat_depth: int = 6
    threat_drop: float = 0.35


# Legacy threshold constants (kept for backward compatibility)
STRUCTURE_MIN = 0.2
OPP_MOBILITY_DROP = 0.15
SELF_MOBILITY_TOL = 0.3
PREVENTIVE_TRIGGER = 0.16
SAFETY_CAP = 0.6
SCORE_THRESHOLD = 0.20
THREAT_DROP = 0.35


def is_full_material(board: chess.Board) -> bool:
    """Return True when all 32 pieces remain on the board."""
    return len(board.piece_map()) >= FULL_MATERIAL_COUNT


def is_prophylaxis_candidate(ctx: TagContext) -> bool:
    """
    Heuristic gate to decide whether a move is eligible for prophylaxis tagging.

    Prophylactic moves must be anticipatory, not reactive. This excludes:
    - Full material positions in early opening (opening noise)
    - Moves that give check (too aggressive)
    - Captures (tactical, not prophylactic)
    - Moves while in check (reactive)
    - Recaptures (reactive)
    - Very early opening moves (prophylaxis is middlegame/endgame concept)

    Args:
        ctx: Tag detection context

    Returns:
        True if move is eligible for prophylaxis tagging
    """
    board = ctx.board
    move = ctx.played_move

    # Exclude full material opening phase
    if is_full_material(board) and board.fullmove_number < OPENING_MOVE_CUTOFF:
        return False

    # Exclude forcing moves (checks)
    if board.gives_check(move):
        return False

    # Get piece being moved
    piece = board.piece_at(move.from_square)
    if not piece:
        return False

    # Exclude captures - tactical, not prophylactic
    if board.is_capture(move):
        return False

    # Exclude moves while in check - reactive, not anticipatory
    if board.is_check():
        return False

    # Exclude recaptures: if opponent just moved to destination square
    if len(board.move_stack) > 0:
        last_move = board.peek()
        if last_move.to_square == move.to_square:
            return False

    return True


def compute_preventive_score(ctx: TagContext) -> Dict[str, Any]:
    """
    Compute preventive score based on opponent restriction.

    Preventive score measures how much the move restricts opponent's resources:
    - Opponent mobility drop (weight 0.3)
    - Opponent tactics drop (weight 0.2)
    - Opponent trend (weight 0.15)

    Note: threat_delta (weight 0.5) is omitted here as it requires engine analysis
    not available in TagContext. For full prophylaxis detection, integrate with
    engine-based threat estimation.

    Args:
        ctx: Tag detection context

    Returns:
        Dict with preventive_score and component breakdowns
    """
    opp_mobility_delta = ctx.opp_component_deltas.get("mobility", 0.0)
    opp_tactics_delta = ctx.opp_component_deltas.get("tactics", 0.0)

    # Compute opponent trend (simplified: just mobility + tactics)
    opp_trend = opp_mobility_delta + opp_tactics_delta

    # Preventive score: reward opponent restriction
    preventive_score = (
        max(0.0, -opp_mobility_delta) * 0.3
        + max(0.0, -opp_tactics_delta) * 0.2
        + max(0.0, -opp_trend) * 0.15
    )

    return {
        "preventive_score": round(preventive_score, 3),
        "opp_mobility_delta": round(opp_mobility_delta, 3),
        "opp_tactics_delta": round(opp_tactics_delta, 3),
        "opp_trend": round(opp_trend, 3),
        "opp_restrained": (
            opp_trend < 0.0
            or opp_mobility_delta <= -0.05
            or opp_tactics_delta <= -0.1
        ),
    }


def compute_soft_weight(ctx: TagContext) -> float:
    """
    Compute soft positioning weight based on self-consolidation.

    Soft weight measures positional improvements:
    - Structure gain (weight 0.4)
    - King safety gain (weight 0.4)
    - Controlled mobility drop (weight 0.2, reward slight drop as consolidation)

    Args:
        ctx: Tag detection context

    Returns:
        Soft weight score (0.0 to SAFETY_CAP)
    """
    structure_delta = ctx.component_deltas.get("structure", 0.0)
    king_safety_delta = ctx.component_deltas.get("king_safety", 0.0)
    mobility_delta = ctx.component_deltas.get("mobility", 0.0)

    # Reward structure and king safety gains
    # Reward controlled mobility drop (consolidation)
    soft_raw = (
        max(0.0, structure_delta) * 0.4
        + max(0.0, king_safety_delta) * 0.4
        + max(0.0, -mobility_delta) * 0.2
    )

    return round(min(soft_raw, SAFETY_CAP), 3)


def estimate_opponent_threat(
    engine_path: str,
    board: chess.Board,
    actor: chess.Color,
    *,
    config: ProphylaxisConfig,
) -> float:
    """
    Probe the position with a fixed-depth search to estimate the opponent's
    immediate tactical resources. Used to grade prophylaxis attempts.

    Matches rule_tagger2/legacy/prophylaxis.py:33-84 exactly.

    Args:
        engine_path: Path to UCI chess engine
        board: Current board position
        actor: Color from whose perspective to evaluate threat
        config: Prophylaxis configuration

    Returns:
        Opponent threat score (0.0 to config.safety_cap)
    """
    temp = board.copy(stack=False)
    if temp.is_game_over():
        return 0.0

    needs_null = temp.turn == actor
    null_pushed = False

    try:
        with chess.engine.SimpleEngine.popen_uci(engine_path) as eng:
            if needs_null and not temp.is_check():
                try:
                    temp.push(chess.Move.null())
                    null_pushed = True
                except ValueError:
                    null_pushed = False

            depth = max(config.threat_depth, 8)
            info = eng.analyse(temp, chess.engine.Limit(depth=depth))
    except Exception:
        if null_pushed:
            temp.pop()
        return 0.0
    finally:
        if null_pushed and len(temp.move_stack) and temp.move_stack[-1] == chess.Move.null():
            temp.pop()

    score_obj = info.get("score")
    if score_obj is None:
        return 0.0

    try:
        pov_score = score_obj.pov(actor)
    except Exception:
        return 0.0

    if pov_score.is_mate():
        mate_in = pov_score.mate()
        if mate_in is None or mate_in > 0:
            return 0.0
        threat = 10.0 / (abs(mate_in) + 1)
    else:
        cp_value = pov_score.score(mate_score=10000) or 0
        threat = max(0.0, -cp_value / 100.0)

    return round(min(threat, config.safety_cap), 3)


def prophylaxis_pattern_reason(
    board: chess.Board,
    move: chess.Move,
    opp_trend: float,
    opp_tactics_delta: float,
) -> Optional[str]:
    """
    Detect canonical prophylaxis motifs for telemetry/debugging.

    Matches rule_tagger2/legacy/prophylaxis.py:87-106 exactly.

    Args:
        board: Current board position
        move: Move being considered
        opp_trend: Opponent's overall trend
        opp_tactics_delta: Opponent's tactics delta

    Returns:
        String describing the pattern, or None if no pattern matches
    """
    piece = board.piece_at(move.from_square)
    if piece is None:
        return None

    trend_ok = opp_trend <= 0.12 or opp_tactics_delta <= 0.12

    if piece.piece_type == chess.BISHOP and trend_ok:
        return "anticipatory bishop retreat"
    if piece.piece_type == chess.KNIGHT and trend_ok:
        return "anticipatory knight reposition"
    if piece.piece_type == chess.KING and (opp_trend <= 0.15 or opp_tactics_delta <= 0.1):
        return "king safety shuffle"
    if piece.piece_type == chess.PAWN and trend_ok:
        return "pawn advance to restrict opponent play"
    return None


def clamp_preventive_score(score: float, *, config: ProphylaxisConfig) -> float:
    """
    Limit the preventive score to a sensible range for downstream thresholds.

    Matches rule_tagger2/legacy/prophylaxis.py:242-246 exactly.

    Args:
        score: Raw preventive score
        config: Prophylaxis configuration

    Returns:
        Clamped score (0.0 to config.safety_cap)
    """
    if score <= 0.0:
        return 0.0
    return min(score, config.safety_cap)


def classify_prophylaxis_quality(
    has_prophylaxis: bool,
    preventive_score: float,
    effective_delta: float,
    tactical_weight: float,
    soft_weight: float,
    *,
    eval_before_cp: int = 0,
    drop_cp: int = 0,
    threat_delta: float = 0.0,
    volatility_drop: float = 0.0,
    pattern_override: bool = False,
    config: ProphylaxisConfig,
) -> Tuple[Optional[str], float]:
    """
    Map prophylaxis heuristics to a quality label.

    Matches rule_tagger2/legacy/prophylaxis.py:161-239 exactly.

    V2 naming convention:
    - prophylactic_direct (was prophylactic_strong): direct tactical prevention with high weight
    - prophylactic_latent (was prophylactic_soft): latent positional prevention
    - prophylactic_meaningless: ineffective prophylaxis

    Args:
        has_prophylaxis: Whether prophylaxis is detected
        preventive_score: Opponent restriction score
        effective_delta: Effective evaluation delta
        tactical_weight: Tactical weight of position
        soft_weight: Soft positioning weight
        eval_before_cp: Evaluation before move (centipawns)
        drop_cp: Evaluation drop (centipawns)
        threat_delta: Threat reduction
        volatility_drop: Volatility reduction (centipawns)
        pattern_override: Whether pattern support exists
        config: Prophylaxis configuration

    Returns:
        Tuple of (label, score) where label is one of:
        - "prophylactic_direct"
        - "prophylactic_latent"
        - "prophylactic_meaningless"
        - None (not prophylaxis)
    """
    if not has_prophylaxis:
        return None, 0.0

    trigger = config.preventive_trigger
    safety_cap = config.safety_cap
    score_threshold = config.score_threshold
    fail_eval_band_cp = 200
    fail_drop_cp = 50

    # Check for failure case first
    if abs(eval_before_cp) <= fail_eval_band_cp and drop_cp < -fail_drop_cp:
        return "prophylactic_meaningless", 0.0

    # If preventive score is below trigger but pattern support exists, classify as latent
    # BUT only if there's also some meaningful signal (not just pattern alone)
    if preventive_score < trigger:
        if pattern_override:
            # Require additional signal beyond just pattern detection
            # Check for threat reduction, volatility drop, or soft positioning value
            has_meaningful_signal = (
                threat_delta >= 0.05  # Some threat reduction
                or volatility_drop >= 15.0  # Some volatility reduction
                or soft_weight >= 0.3  # Decent soft positioning
                or preventive_score >= trigger * 0.5  # At least half the trigger threshold
            )

            if has_meaningful_signal:
                # Pattern-supported prophylaxis with meaningful signal gets latent tag
                latent_base = 0.45
                latent_score = max(latent_base, soft_weight * 0.8, preventive_score * 2.0)
                return "prophylactic_latent", round(min(latent_score, safety_cap), 3)
        return None, 0.0

    # Convert volatility drop to a normalized signal (0-1 scale).
    volatility_signal = max(0.0, min(1.0, volatility_drop / 40.0))
    threat_signal = max(0.0, threat_delta)
    soft_signal = max(0.0, soft_weight)

    direct_gate = (
        preventive_score >= (trigger + 0.02)
        or threat_signal >= max(config.threat_drop * 0.85, 0.2)
        or (soft_signal >= 0.65 and tactical_weight <= 0.6)
        or volatility_signal >= 0.65
    )

    if direct_gate:
        direct_score = max(score_threshold, preventive_score, soft_signal, threat_signal, 0.75)
        label = "prophylactic_direct"
        final_score = round(min(direct_score, safety_cap), 3)
    else:
        latent_base = 0.55 if effective_delta < 0 else 0.45
        latent_score = max(latent_base, preventive_score * 0.9, soft_signal)
        label = "prophylactic_latent"
        final_score = round(min(latent_score, safety_cap), 3)

    if abs(eval_before_cp) <= fail_eval_band_cp and drop_cp < -fail_drop_cp:
        return "prophylactic_meaningless", 0.0

    return label, final_score


__all__ = [
    "ProphylaxisConfig",
    "is_prophylaxis_candidate",
    "compute_preventive_score",
    "compute_soft_weight",
    "is_full_material",
    "estimate_opponent_threat",
    "prophylaxis_pattern_reason",
    "clamp_preventive_score",
    "classify_prophylaxis_quality",
    "STRUCTURE_MIN",
    "OPP_MOBILITY_DROP",
    "SELF_MOBILITY_TOL",
    "PREVENTIVE_TRIGGER",
    "SAFETY_CAP",
    "SCORE_THRESHOLD",
    "THREAT_DROP",
]
