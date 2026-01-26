"""
Adapter for rule_tagger2 blackbox implementation.
"""
from __future__ import annotations

from dataclasses import MISSING, fields
from typing import Any, Dict, Literal, Optional, Tuple
import os
import sys

from core.tagger.tag_result import TagResult
from core.tagger.config.engine import DEFAULT_DEPTH, DEFAULT_MULTIPV, DEFAULT_STOCKFISH_PATH
from core.tagger.engine.http_client import HTTPStockfishClient

DEFAULT_ENGINE_URL = os.environ.get("ENGINE_URL", "https://sf.catachess.com/engine")


def _ensure_blackbox_path() -> Optional[str]:
    """Inject BLACKBOX_TAGGER_PATH into sys.path if provided."""
    path = os.environ.get("BLACKBOX_TAGGER_PATH")
    if path and path not in sys.path:
        sys.path.insert(0, path)
    return path


def _load_blackbox_entrypoint():
    _ensure_blackbox_path()
    try:
        from rule_tagger2.core.facade import tag_position as blackbox_tag_position
    except Exception as exc:  # pragma: no cover - import-time diagnostics
        raise ImportError(
            "Failed to import rule_tagger2. Set BLACKBOX_TAGGER_PATH to the directory "
            "that contains rule_tagger2 or ensure it is importable."
        ) from exc
    return blackbox_tag_position


def _install_http_engine_shims(engine_url: str) -> None:
    try:
        import chess
        import rule_tagger2.legacy.core as legacy_core
        import rule_tagger2.legacy.core_v8 as legacy_core_v8
        import rule_tagger2.legacy.engine.analysis as legacy_analysis
        import rule_tagger2.legacy.engine as legacy_engine
    except Exception as exc:  # pragma: no cover - import-time diagnostics
        raise ImportError(
            "Failed to import rule_tagger2 legacy engine modules for HTTP engine shims."
        ) from exc

    from rule_tagger2.models import Candidate

    def _http_analyse_candidates(
        engine_path: str,
        board: chess.Board,
        depth: int = 14,
        multipv: int = 6,
        depth_low: int = 6,
    ) -> Tuple[list[Candidate], int, Dict[str, Any]]:
        _ = engine_path
        client = HTTPStockfishClient(base_url=engine_url)

        candidates, eval_before_cp, meta = client.analyse_candidates(board, depth, multipv)
        mapped: list[Candidate] = [
            Candidate(move=cand.move, score_cp=cand.score_cp, kind=cand.kind) for cand in candidates
        ]

        low_cp = eval_before_cp
        if depth_low and depth_low < depth:
            _, low_cp, _ = client.analyse_candidates(board, depth_low, 1)

        depth_high = max(depth + 4, depth + 2)
        high_cp = eval_before_cp
        if depth_high > depth:
            _, high_cp, _ = client.analyse_candidates(board, depth_high, 1)

        score_gap_cp = mapped[0].score_cp - mapped[1].score_cp if len(mapped) > 1 else 0
        depth_jump_cp = eval_before_cp - low_cp
        deepening_gain_cp = high_cp - eval_before_cp
        contact_ratio, total_moves, capture_count, checking_count = legacy_analysis.contact_profile(board)
        phase_ratio = legacy_analysis.estimate_phase_ratio(board)
        mate_threat = abs(eval_before_cp) >= 9000 or abs(high_cp) >= 9000

        analysis_meta: Dict[str, Any] = {
            "score_gap_cp": score_gap_cp,
            "depth_jump_cp": depth_jump_cp,
            "deepening_gain_cp": deepening_gain_cp,
            "contact_ratio": contact_ratio,
            "contact_moves": capture_count + checking_count,
            "capture_moves": capture_count,
            "checking_moves": checking_count,
            "total_moves": total_moves,
            "phase_ratio": round(phase_ratio, 3),
            "mate_threat": mate_threat,
        }
        analysis_meta.setdefault("engine_meta", {})
        analysis_meta["engine_meta"].update(
            {
                "depth_used": depth,
                "multipv": multipv,
                "depth_low": depth_low,
                "depth_high": depth_high,
                "engine_url": engine_url,
                "engine_mode": "http",
            }
        )

        return mapped, eval_before_cp, analysis_meta

    def _http_eval_specific_move(
        engine_path: str,
        board: chess.Board,
        move: chess.Move,
        depth: int = 14,
    ) -> int:
        _ = engine_path
        client = HTTPStockfishClient(base_url=engine_url)
        return client.eval_specific(board, move, depth)

    def _http_simulate_followup_metrics(
        engine: chess.engine.SimpleEngine,
        board: chess.Board,
        actor: chess.Color,
        steps: int = 3,
        depth: int = 6,
    ) -> Tuple[Dict[str, float], Dict[str, float], list[Dict[str, float]], list[Dict[str, float]]]:
        _ = engine
        client = HTTPStockfishClient(base_url=engine_url)
        future_board = board.copy(stack=False)
        base_metrics, base_opp_metrics, _ = legacy_analysis.evaluation_and_metrics(future_board, actor)
        metrics_seq: list[Dict[str, float]] = []
        opp_seq: list[Dict[str, float]] = []
        for _ in range(steps):
            if future_board.is_game_over():
                break
            candidates, _, _ = client.analyse_candidates(future_board, depth, 1)
            if not candidates:
                break
            move = candidates[0].move
            future_board.push(move)
            metrics, opp_metrics, _ = legacy_analysis.evaluation_and_metrics(future_board, actor)
            metrics_seq.append(metrics)
            opp_seq.append(opp_metrics)
        return base_metrics, base_opp_metrics, metrics_seq, opp_seq

    for module in (legacy_analysis, legacy_engine):
        module.analyse_candidates = _http_analyse_candidates
        module.eval_specific_move = _http_eval_specific_move
        module.simulate_followup_metrics = _http_simulate_followup_metrics

    for module in (legacy_core, legacy_core_v8):
        module.analyse_candidates = _http_analyse_candidates
        module.eval_specific_move = _http_eval_specific_move
        module.simulate_followup_metrics = _http_simulate_followup_metrics


def _default_for_field(field) -> Any:
    if field.default is not MISSING:
        return field.default
    if field.default_factory is not MISSING:  # type: ignore[comparison-overlap]
        return field.default_factory()  # type: ignore[misc]
    return None


def _coerce_result(result: Any) -> TagResult:
    if isinstance(result, TagResult):
        _annotate_context(result)
        return result

    data: dict[str, Any] = {}
    for field in fields(TagResult):
        if hasattr(result, field.name):
            data[field.name] = getattr(result, field.name)
        else:
            data[field.name] = _default_for_field(field)

    coerced = TagResult(**data)
    _annotate_context(coerced)
    return coerced


def _annotate_context(result: TagResult) -> None:
    ctx = result.analysis_context
    if not isinstance(ctx, dict):
        ctx = {"_raw_analysis_context": ctx}
    engine_meta = ctx.get("engine_meta")
    if isinstance(engine_meta, dict):
        engine_meta.setdefault("__tagger_impl__", "blackbox")
    else:
        ctx["engine_meta"] = {
            "__tagger_impl__": "blackbox",
            "_raw_engine_meta": engine_meta,
        }
    result.analysis_context = ctx


def tag_position(
    engine_path: Optional[str] = None,
    fen: str = "",
    played_move_uci: str = "",
    depth: int = DEFAULT_DEPTH,
    multipv: int = DEFAULT_MULTIPV,
    engine_mode: Literal["local", "http"] = "http",
    engine_url: Optional[str] = None,
) -> TagResult:
    """
    Tag a position using the rule_tagger2 blackbox.

    Note: rule_tagger2 expects a local engine path, so http engine settings are ignored.
    """
    if engine_mode not in ("local", "http"):
        raise ValueError(f"Unsupported engine_mode: {engine_mode}")

    resolved_engine_url = engine_url or DEFAULT_ENGINE_URL
    if engine_mode == "http":
        _install_http_engine_shims(resolved_engine_url)
        resolved_engine_path = resolved_engine_url
    else:
        resolved_engine_path = engine_path or DEFAULT_STOCKFISH_PATH
    blackbox_tag_position = _load_blackbox_entrypoint()

    result = blackbox_tag_position(
        resolved_engine_path,
        fen,
        played_move_uci,
        depth=depth,
        multipv=multipv,
    )

    return _coerce_result(result)


__all__ = ["tag_position"]
