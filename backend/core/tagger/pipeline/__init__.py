"""
Pipeline orchestration for staged tag detection.

This module implements a 5-stage pipeline:
1. EngineStage - Chess engine analysis
2. FeatureStage - Feature extraction
3. ModeStage - Game mode classification
4. TaggingStage - Tag detection
5. FinalizeStage - Result assembly
"""
from .models import (
    EngineMove,
    EngineCandidates,
    FeatureBundle,
    ModeDecision,
    TagBundle,
    FinalResult,
    PipelineContext,
)
from .runner import TaggingPipeline, run_pipeline
from .stages import (
    Stage,
    EngineStage,
    FeatureStage,
    ModeStage,
    TaggingStage,
    FinalizeStage,
)

__all__ = [
    # Models
    "EngineMove",
    "EngineCandidates",
    "FeatureBundle",
    "ModeDecision",
    "TagBundle",
    "FinalResult",
    "PipelineContext",
    # Runner
    "TaggingPipeline",
    "run_pipeline",
    # Stages
    "Stage",
    "EngineStage",
    "FeatureStage",
    "ModeStage",
    "TaggingStage",
    "FinalizeStage",
]
