"""
Pipeline runner for staged tag detection.
Adapted from rule_tagger2 for catachess backend.
"""
from __future__ import annotations

from typing import List

from .models import FinalResult, PipelineContext
from .stages import (
    EngineStage,
    FeatureStage,
    ModeStage,
    TaggingStage,
    FinalizeStage,
    Stage,
)


class TaggingPipeline:
    """
    Orchestrates the full tagging pipeline through multiple stages.

    Pipeline stages:
    1. EngineStage - Analyze position with chess engine
    2. FeatureStage - Extract positional features
    3. ModeStage - Determine game mode (winning/neutral/losing)
    4. TaggingStage - Detect all applicable tags
    5. FinalizeStage - Assemble final result
    """

    def __init__(
        self,
        engine: Any,
        *,
        depth: int = 14,
        multipv: int = 6,
        cp_threshold: int = 100,
        depth_low: int = 6,
        stages: List[Stage] | None = None,
    ) -> None:
        """
        Initialize tagging pipeline.

        Args:
            engine: Chess engine client
            depth: Engine analysis depth
            multipv: Number of principal variations
            cp_threshold: Centipawn threshold for candidate band
            depth_low: Low-depth analysis threshold
            stages: Custom stages (uses default if None)
        """
        self._engine = engine
        self._depth = depth
        self._multipv = multipv
        self._cp_threshold = cp_threshold
        self._depth_low = depth_low

        if stages is None:
            self._stages = [
                EngineStage(depth=depth, multipv=multipv, depth_low=depth_low),
                FeatureStage(),
                ModeStage(),
                TaggingStage(),
                FinalizeStage(),
            ]
        else:
            self._stages = list(stages)

    def evaluate(self, fen: str, played_move_uci: str) -> FinalResult:
        """
        Run full pipeline on a position and move.

        Args:
            fen: FEN string of position before move
            played_move_uci: UCI notation of played move

        Returns:
            FinalResult with tags, features, and analysis
        """
        ctx = PipelineContext(
            fen=fen,
            played_move_uci=played_move_uci,
            engine=self._engine,
            engine_depth=self._depth,
            engine_multipv=self._multipv,
            cp_threshold=self._cp_threshold,
        )
        return run_pipeline(ctx, self._stages)


def run_pipeline(ctx: PipelineContext, stages: List[Stage]) -> FinalResult:
    """
    Execute pipeline stages in sequence.

    Args:
        ctx: Pipeline context
        stages: List of stages to execute

    Returns:
        FinalResult from pipeline

    Raises:
        RuntimeError: If pipeline fails to produce result
    """
    for stage in stages:
        stage.run(ctx)

    if ctx.final is None:
        raise RuntimeError("Pipeline did not produce a FinalResult")

    return ctx.final


__all__ = ["TaggingPipeline", "run_pipeline"]
