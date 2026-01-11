"""Prophylaxis tag detectors - 5 detectors in 1 file."""
from backend.core.tagger.models import TagContext, TagEvidence
from backend.core.tagger.detectors.helpers.prophylaxis import compute_preventive_score

def detect_prophylactic_move(ctx: TagContext) -> TagEvidence:
    """General prophylactic move."""
    gates_passed, gates_failed, evidence = [], [], {}
    preventive_score = compute_preventive_score(ctx)
    evidence.update({"preventive_score": preventive_score})
    
    if preventive_score > 0.4:
        gates_passed.append("prophylactic")
        fired, confidence = True, 0.7 + min(0.3, preventive_score * 0.3)
    else:
        gates_failed.append("prophylactic")
        fired, confidence = False, 0.0
    
    return TagEvidence("prophylactic_move", fired, min(1.0, confidence), evidence, gates_passed, gates_failed)

def detect_prophylactic_direct(ctx: TagContext) -> TagEvidence:
    """High quality prophylaxis."""
    gates_passed, gates_failed, evidence = [], [], {}
    preventive_score = compute_preventive_score(ctx)
    evidence.update({"preventive_score": preventive_score, "delta_eval": ctx.delta_eval})
    
    if preventive_score > 0.6 and ctx.delta_eval >= -0.1:
        gates_passed.append("high_quality")
        fired, confidence = True, 0.85
    else:
        gates_failed.append("high_quality")
        fired, confidence = False, 0.0
    
    return TagEvidence("prophylactic_direct", fired, confidence, evidence, gates_passed, gates_failed)

def detect_prophylactic_latent(ctx: TagContext) -> TagEvidence:
    """Subtle prophylaxis."""
    gates_passed, gates_failed, evidence = [], [], {}
    preventive_score = compute_preventive_score(ctx)
    evidence.update({"preventive_score": preventive_score})
    
    if 0.3 < preventive_score <= 0.6:
        gates_passed.append("latent")
        fired, confidence = True, 0.7
    else:
        gates_failed.append("latent")
        fired, confidence = False, 0.0
    
    return TagEvidence("prophylactic_latent", fired, confidence, evidence, gates_passed, gates_failed)

def detect_prophylactic_meaningless(ctx: TagContext) -> TagEvidence:
    """Meaningless prophylaxis."""
    gates_passed, gates_failed, evidence = [], [], {}
    preventive_score = compute_preventive_score(ctx)
    evidence.update({"preventive_score": preventive_score, "delta_eval": ctx.delta_eval})
    
    if 0.2 < preventive_score <= 0.4 and ctx.delta_eval < -0.3:
        gates_passed.append("meaningless")
        fired, confidence = True, 0.7
    else:
        gates_failed.append("meaningless")
        fired, confidence = False, 0.0
    
    return TagEvidence("prophylactic_meaningless", fired, confidence, evidence, gates_passed, gates_failed)

def detect_failed_prophylactic(ctx: TagContext) -> TagEvidence:
    """Failed prophylaxis."""
    gates_passed, gates_failed, evidence = [], [], {}
    preventive_score = compute_preventive_score(ctx)
    evidence.update({"preventive_score": preventive_score, "delta_eval": ctx.delta_eval})
    
    if preventive_score > 0.3 and ctx.delta_eval < -0.5:
        gates_passed.append("failed")
        fired, confidence = True, 0.75
    else:
        gates_failed.append("failed")
        fired, confidence = False, 0.0
    
    return TagEvidence("failed_prophylactic", fired, confidence, evidence, gates_passed, gates_failed)

__all__ = ["detect_prophylactic_move", "detect_prophylactic_direct", "detect_prophylactic_latent", "detect_prophylactic_meaningless", "detect_failed_prophylactic"]
