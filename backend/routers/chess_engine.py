"""
Chess Engine Router

Exposes Analysis (Cloud Eval) to frontend.
Stage 11: Switched to Lichess Cloud Eval API.
Stage 12: Added MongoDB global cache.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from core.chess_engine.client import EngineClient
from core.errors import ChessEngineError, ChessEngineTimeoutError
from core.log.log_chess_engine import logger
from core.cache import get_mongo_cache


router = APIRouter(
    prefix="/api/engine",
    tags=["chess-engine"],
)


class AnalyzeRequest(BaseModel):
    """Request to analyze a chess position"""
    fen: str
    depth: int = 15
    multipv: int = 3
    engine: str | None = None


class AnalyzeResponse(BaseModel):
    """Analysis result from engine"""
    lines: list[dict]
    source: str | None = None


# Initialize engine client
# Note: We replaced the complex get_engine() factory with direct EngineClient usage
engine = EngineClient()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_position(request: AnalyzeRequest):
    """
    Analyze a chess position using MongoDB cache → Engine fallback.

    Flow:
    1. Check MongoDB global cache
    2. If hit: return cached result (fast path)
    3. If miss: call engine → store in MongoDB → return

    Returns:
        AnalyzeResponse with principal variations
    """
    import time
    start_time = time.time()

    try:
        logger.info("=" * 80)
        logger.info(f"[ENGINE ANALYZE] Request started")
        logger.info(f"[ENGINE ANALYZE] FEN: {request.fen}")
        logger.info(f"[ENGINE ANALYZE] Depth: {request.depth}, MultiPV: {request.multipv}, Engine: {request.engine or 'auto'}")

        # Step 1: Check MongoDB cache
        mongo_cache = await get_mongo_cache()
        engine_mode = request.engine or 'auto'

        cache_result = await mongo_cache.get(
            fen=request.fen,
            depth=request.depth,
            multipv=request.multipv,
            engine_mode=engine_mode
        )

        if cache_result:
            # Cache hit - return immediately
            await mongo_cache.increment_hit_count(cache_result['cache_key'])

            total_duration = time.time() - start_time
            logger.info(f"[ENGINE ANALYZE] ✓ MongoDB cache HIT")
            logger.info(f"[ENGINE ANALYZE] Source: {cache_result['source']}_cached")
            logger.info(f"[ENGINE ANALYZE] Lines returned: {len(cache_result['lines'])}")
            logger.info(f"[ENGINE ANALYZE] Total duration: {total_duration:.3f}s (cache hit)")
            logger.info("=" * 80)

            return AnalyzeResponse(
                lines=cache_result['lines'],
                source=f"{cache_result['source']}_cached"
            )

        # Step 2: Cache miss - call engine
        logger.info(f"[ENGINE ANALYZE] ✗ MongoDB cache MISS - calling engine")

        engine_start = time.time()
        result = engine.analyze(
            fen=request.fen,
            depth=request.depth,
            multipv=request.multipv,
            engine=request.engine,
        )
        engine_duration = time.time() - engine_start

        # Convert to response format
        lines = [
            {
                "multipv": line.multipv,
                "score": line.score,
                "pv": line.pv,
            }
            for line in result.lines
        ]

        # Step 3: Store in MongoDB cache
        store_start = time.time()
        await mongo_cache.set(
            fen=request.fen,
            depth=request.depth,
            multipv=request.multipv,
            engine_mode=engine_mode,
            lines=lines,
            source=result.source
        )
        store_duration = time.time() - store_start

        total_duration = time.time() - start_time
        logger.info(f"[ENGINE ANALYZE] Analysis complete")
        logger.info(f"[ENGINE ANALYZE] Source: {result.source}")
        logger.info(f"[ENGINE ANALYZE] Lines returned: {len(lines)}")
        logger.info(f"[ENGINE ANALYZE] Engine call duration: {engine_duration:.3f}s")
        logger.info(f"[ENGINE ANALYZE] MongoDB store duration: {store_duration:.3f}s")
        logger.info(f"[ENGINE ANALYZE] Total duration: {total_duration:.3f}s")
        logger.info("=" * 80)

        return AnalyzeResponse(lines=lines, source=result.source)

    except ChessEngineTimeoutError as e:
        logger.error(f"Engine timeout: {e}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Engine request timed out after {e.timeout}s"
        )
    except ChessEngineError as e:
        logger.error(f"Engine error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Analysis unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze position: {str(e)}"
        )


@router.get("/health")
async def engine_health():
    """
    Check engine health.
    """
    return {
        "status": "healthy",
        "service": "lichess-cloud-eval",
    }


@router.get("/cache/stats")
async def cache_stats():
    """
    Get MongoDB cache statistics.
    """
    try:
        mongo_cache = await get_mongo_cache()
        stats = await mongo_cache.get_stats()
        hot_positions = await mongo_cache.get_hot_positions(limit=10)

        return {
            "cache": stats,
            "hot_positions": hot_positions,
            "note": "Data is stored permanently (no auto-expiration)",
        }
    except Exception as e:
        logger.error(f"Cache stats error: {e}")
        return {
            "cache": {"enabled": False, "error": str(e)},
            "hot_positions": [],
        }
