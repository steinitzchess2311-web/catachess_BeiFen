"""
Pipeline-specific models for staged rule tagging.
Adapted from rule_tagger2 for catachess backend.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import chess

from ..models import Candidate, TagContext


@dataclass
class EngineCandidates:
    """Engine analysis output with candidate moves."""
    candidates: List[EngineMove]
    eval_before_cp: int
    engine_meta: Dict[str, Any] = field(default_factory=dict)

    def best(self) -> EngineMove:
        """Get the best candidate move."""
        if not self.candidates:
            raise ValueError("No candidates available")
        return self.candidates[0]


@dataclass
class EngineMove:
    """A single engine candidate move with evaluation."""
    move: chess.Move
    score_cp: int
    kind: str  # "quiet", "dynamic", "forcing"
    depth: int = 0
    multipv: int = 0


@dataclass
class FeatureBundle:
    """Extracted features from position analysis."""
    fen: str
    played_move: chess.Move
    best_move: chess.Move
    tactical_weight: float

    # Metrics
    metrics_before: Dict[str, float]
    metrics_played: Dict[str, float]
    metrics_best: Dict[str, float]
    opp_metrics_before: Dict[str, float]
    opp_metrics_played: Dict[str, float]
    opp_metrics_best: Dict[str, float]

    # Evaluations
    evaluation_before: Dict[str, Any]
    evaluation_played: Dict[str, Any]
    evaluation_best: Dict[str, Any]

    # Deltas
    component_deltas: Dict[str, float]
    change_played_vs_before: Dict[str, float]
    opp_component_deltas: Dict[str, float]
    opp_change_played_vs_before: Dict[str, float]

    # Analysis metadata
    analysis_meta: Dict[str, Any] = field(default_factory=dict)
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ModeDecision:
    """Game mode classification."""
    mode: str  # "winning", "neutral", "losing"
    confidence: float
    eval_before: float


@dataclass
class TagBundle:
    """Collection of detected tags with evidence."""
    primary_tags: List[str]
    secondary_tags: List[str]
    tag_evidence: Dict[str, Dict[str, Any]]
    suppressed_tags: List[str] = field(default_factory=list)


@dataclass
class FinalResult:
    """Final pipeline output."""
    features: FeatureBundle
    mode: ModeDecision
    tags: TagBundle
    raw_result: Optional[Any] = None


@dataclass
class PipelineContext:
    """Context container passed through pipeline stages."""
    fen: str
    played_move_uci: str
    engine: Any  # EngineClient
    engine_depth: int
    engine_multipv: int
    cp_threshold: int
    followup_depth: int = 6
    followup_steps: int = 3
    metadata: Dict[str, Any] = field(default_factory=dict)

    # Stage outputs
    engine_out: Optional[EngineCandidates] = None
    features: Optional[FeatureBundle] = None
    mode: Optional[ModeDecision] = None
    tags: Optional[TagBundle] = None
    final: Optional[FinalResult] = None


__all__ = [
    "EngineMove",
    "EngineCandidates",
    "FeatureBundle",
    "ModeDecision",
    "TagBundle",
    "FinalResult",
    "PipelineContext",
]
