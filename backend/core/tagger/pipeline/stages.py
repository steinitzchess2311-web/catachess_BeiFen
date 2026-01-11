"""
Pipeline stages for tag detection.
Each stage performs a specific transformation on the pipeline context.
"""
from __future__ import annotations

from typing import Protocol

import chess

from .models import (
    PipelineContext,
    EngineCandidates,
    EngineMove,
    FeatureBundle,
    ModeDecision,
    TagBundle,
    FinalResult,
)
from ..detectors.helpers.metrics import evaluation_and_metrics, metrics_delta
from ..detectors.helpers.phase import estimate_phase_ratio, get_phase_bucket
from ..detectors.helpers.tactical_weight import compute_tactical_weight
from ..detectors.helpers.contact import contact_ratio


class Stage(Protocol):
    """Protocol for pipeline stages."""

    def run(self, ctx: PipelineContext) -> None:
        """Execute stage logic, modifying context in place."""
        ...


class EngineStage:
    """Stage 1: Analyze position with chess engine."""

    def __init__(self, *, depth: int, multipv: int, depth_low: int = 0) -> None:
        self._depth = depth
        self._multipv = multipv
        self._depth_low = depth_low

    def run(self, ctx: PipelineContext) -> None:
        """
        Analyze position with chess engine and populate candidates.

        Modifies ctx.engine_out with EngineCandidates.
        """
        board = chess.Board(ctx.fen)

        # Analyze candidates
        candidates, eval_before_cp, engine_meta = ctx.engine.analyse_candidates(
            board, self._depth, self._multipv
        )

        # Convert to EngineMove format
        engine_moves = [
            EngineMove(
                move=cand.move,
                score_cp=cand.score_cp,
                kind=cand.kind,
                depth=self._depth,
                multipv=i + 1,
            )
            for i, cand in enumerate(candidates)
        ]

        ctx.engine_out = EngineCandidates(
            candidates=engine_moves,
            eval_before_cp=eval_before_cp,
            engine_meta=engine_meta,
        )


class FeatureStage:
    """Stage 2: Extract positional features from engine analysis."""

    def run(self, ctx: PipelineContext) -> None:
        """
        Extract features from position and engine analysis.

        Requires: ctx.engine_out
        Modifies: ctx.features
        """
        if ctx.engine_out is None:
            raise RuntimeError("EngineStage must run before FeatureStage")

        board = chess.Board(ctx.fen)
        played_move = chess.Move.from_uci(ctx.played_move_uci)
        best_move = ctx.engine_out.best().move

        # Create boards for each state
        board_played = board.copy()
        board_played.push(played_move)

        board_best = board.copy()
        board_best.push(best_move)

        # Compute metrics for each state
        metrics_before, opp_metrics_before, eval_before = evaluation_and_metrics(
            board, board.turn
        )
        metrics_played, opp_metrics_played, eval_played = evaluation_and_metrics(
            board_played, board.turn
        )
        metrics_best, opp_metrics_best, eval_best = evaluation_and_metrics(
            board_best, board.turn
        )

        # Compute deltas
        component_deltas = metrics_delta(metrics_before, metrics_played)
        change_played_vs_before = {
            k: metrics_played.get(k, 0.0) - metrics_before.get(k, 0.0)
            for k in metrics_played.keys()
        }
        opp_component_deltas = metrics_delta(opp_metrics_before, opp_metrics_played)
        opp_change_played_vs_before = {
            k: opp_metrics_played.get(k, 0.0) - opp_metrics_before.get(k, 0.0)
            for k in opp_metrics_played.keys()
        }

        # Compute tactical weight
        phase_ratio = estimate_phase_ratio(board)
        contact_ratio_before = contact_ratio(board)

        eval_before_cp = ctx.engine_out.eval_before_cp
        eval_played_cp = ctx.engine_out.engine_meta.get(
            "eval_played_cp",
            ctx.engine_out.best().score_cp,
        )
        eval_best_cp = ctx.engine_out.best().score_cp

        delta_eval_cp = eval_played_cp - eval_before_cp
        delta_tactics = component_deltas.get("tactics", 0.0)
        delta_structure = component_deltas.get("structure", 0.0)

        engine_meta = ctx.engine_out.engine_meta
        depth_jump_cp = engine_meta.get("depth_jump_cp", 0)
        deepening_gain_cp = engine_meta.get("deepening_gain_cp", 0)
        score_gap_cp = (
            abs(eval_best_cp - ctx.engine_out.candidates[1].score_cp)
            if len(ctx.engine_out.candidates) > 1
            else 0
        )

        best_kind = ctx.engine_out.best().kind
        played_kind = next(
            (c.kind for c in ctx.engine_out.candidates if c.move == played_move),
            "quiet",
        )

        best_is_forcing = best_kind in ("dynamic", "forcing")
        played_is_forcing = played_kind in ("dynamic", "forcing")
        mate_threat = engine_meta.get("mate_threat", False)

        tactical_weight = compute_tactical_weight(
            delta_eval_cp=delta_eval_cp,
            delta_tactics=delta_tactics,
            delta_structure=delta_structure,
            depth_jump_cp=depth_jump_cp,
            deepening_gain_cp=deepening_gain_cp,
            score_gap_cp=score_gap_cp,
            contact_ratio=contact_ratio_before,
            phase_ratio=phase_ratio,
            best_is_forcing=best_is_forcing,
            played_is_forcing=played_is_forcing,
            mate_threat=mate_threat,
        )

        # Assemble feature bundle
        ctx.features = FeatureBundle(
            fen=ctx.fen,
            played_move=played_move,
            best_move=best_move,
            tactical_weight=tactical_weight,
            metrics_before=metrics_before,
            metrics_played=metrics_played,
            metrics_best=metrics_best,
            opp_metrics_before=opp_metrics_before,
            opp_metrics_played=opp_metrics_played,
            opp_metrics_best=opp_metrics_best,
            evaluation_before={"score_cp": eval_before_cp, "eval": eval_before},
            evaluation_played={"score_cp": eval_played_cp, "eval": eval_played},
            evaluation_best={"score_cp": eval_best_cp, "eval": eval_best},
            component_deltas=component_deltas,
            change_played_vs_before=change_played_vs_before,
            opp_component_deltas=opp_component_deltas,
            opp_change_played_vs_before=opp_change_played_vs_before,
            analysis_meta={
                "phase_ratio": phase_ratio,
                "phase_bucket": get_phase_bucket(phase_ratio),
                "contact_ratio": contact_ratio_before,
                "played_kind": played_kind,
                "best_kind": best_kind,
                "eval_before_cp": eval_before_cp,
                "eval_played_cp": eval_played_cp,
                "eval_best_cp": eval_best_cp,
            },
            extra={
                "coverage": {"before": 0, "after": 0, "delta": 0},  # TODO
            },
        )


class ModeStage:
    """Stage 3: Determine game mode from evaluation."""

    def run(self, ctx: PipelineContext) -> None:
        """
        Classify game mode based on evaluation.

        Requires: ctx.features
        Modifies: ctx.mode
        """
        if ctx.features is None:
            raise RuntimeError("FeatureStage must run before ModeStage")

        eval_before = ctx.features.evaluation_before["eval"]

        if eval_before >= 2.0:
            mode = "winning"
            confidence = min(1.0, (eval_before - 2.0) / 3.0 + 0.5)
        elif eval_before <= -2.0:
            mode = "losing"
            confidence = min(1.0, (-eval_before - 2.0) / 3.0 + 0.5)
        else:
            mode = "neutral"
            confidence = 1.0 - abs(eval_before) / 2.0

        ctx.mode = ModeDecision(
            mode=mode,
            confidence=confidence,
            eval_before=eval_before,
        )


class TaggingStage:
    """Stage 4: Run all tag detectors."""

    def run(self, ctx: PipelineContext) -> None:
        """
        Execute all tag detectors and assemble results.

        Requires: ctx.features, ctx.mode
        Modifies: ctx.tags
        """
        if ctx.features is None or ctx.mode is None:
            raise RuntimeError("ModeStage must run before TaggingStage")

        # Import facade to reuse tag detection logic
        from ..facade import tag_position
        from ..engine.stockfish_client import StockfishClient

        # Run full tag detection via facade
        # This reuses all the existing detector implementations
        engine_path = getattr(ctx.engine, "_engine_path", None)
        if engine_path is None:
            # If engine_path not available, use default
            from ..config.engine import DEFAULT_STOCKFISH_PATH
            engine_path = DEFAULT_STOCKFISH_PATH

        result = tag_position(
            engine_path=engine_path,
            fen=ctx.fen,
            played_move_uci=ctx.played_move_uci,
            depth=ctx.engine_depth,
            multipv=ctx.engine_multipv,
        )

        # Extract tags from result
        primary_tags = []
        tag_evidence = {}

        # Collect all fired tags
        for field, value in vars(result).items():
            if isinstance(value, bool) and value:
                primary_tags.append(field)
                tag_evidence[field] = {
                    "fired": True,
                    "confidence": 1.0,
                }

        ctx.tags = TagBundle(
            primary_tags=primary_tags,
            secondary_tags=[],
            tag_evidence=tag_evidence,
            suppressed_tags=[],
        )

        # Store legacy result for reference
        ctx.metadata["legacy_result"] = result


class FinalizeStage:
    """Stage 5: Assemble final result."""

    def run(self, ctx: PipelineContext) -> None:
        """
        Create final result from pipeline outputs.

        Requires: ctx.features, ctx.mode, ctx.tags
        Modifies: ctx.final
        """
        if ctx.features is None or ctx.mode is None or ctx.tags is None:
            raise RuntimeError("All stages must complete before FinalizeStage")

        ctx.final = FinalResult(
            features=ctx.features,
            mode=ctx.mode,
            tags=ctx.tags,
            raw_result=ctx.metadata.get("legacy_result"),
        )


__all__ = [
    "Stage",
    "EngineStage",
    "FeatureStage",
    "ModeStage",
    "TaggingStage",
    "FinalizeStage",
]
