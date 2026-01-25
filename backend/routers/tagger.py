"""
Tagger Router - API 路由

API 列表（来自 Stage 02）：
- POST /api/tagger/players
- GET /api/tagger/players
- GET /api/tagger/players/:id
- POST /api/tagger/players/:id/uploads
- GET /api/tagger/players/:id/stats
- GET /api/tagger/players/:id/exports
"""
import uuid
import csv
import json
from io import StringIO
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from core.db.deps import get_db
from services.tagger_service import TaggerService
from schemas.tagger import (
    PlayerCreate,
    PlayerResponse,
    PlayerListResponse,
    UploadResponse,
    StatsListResponse,
    StatsResponse,
    TagStatItem,
    FailedGamesResponse,
    FailedGameItem,
)

router = APIRouter(prefix="/api/tagger", tags=["tagger"])


def get_tagger_service(db: Session = Depends(get_db)) -> TaggerService:
    return TaggerService(db)


# === Player Endpoints ===

@router.post("/players", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
async def create_player(
    request: PlayerCreate,
    service: TaggerService = Depends(get_tagger_service),
):
    """创建棋手档案"""
    player = service.create_player(
        display_name=request.display_name,
        aliases=request.aliases,
    )
    return player


@router.get("/players", response_model=PlayerListResponse)
async def list_players(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: TaggerService = Depends(get_tagger_service),
):
    """获取棋手列表"""
    players, total = service.list_players(offset=offset, limit=limit)
    return PlayerListResponse(players=players, total=total)


@router.get("/players/{player_id}", response_model=PlayerResponse)
async def get_player(
    player_id: uuid.UUID,
    service: TaggerService = Depends(get_tagger_service),
):
    """获取单个棋手"""
    player = service.get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


# === Upload Endpoints ===

@router.post("/players/{player_id}/uploads", response_model=UploadResponse)
async def upload_pgn(
    player_id: uuid.UUID,
    file: UploadFile = File(...),
    service: TaggerService = Depends(get_tagger_service),
):
    """上传 PGN 文件"""
    player = service.get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    content = await file.read()
    # TODO: 从 auth 获取 user_id
    upload_user_id = uuid.uuid4()

    upload = service.create_upload(
        player_id=player_id,
        pgn_content=content,
        original_filename=file.filename or "upload.pgn",
        upload_user_id=upload_user_id,
    )

    status_info = service.get_upload_status(upload.id)
    return UploadResponse(**status_info)


# === Stats Endpoints ===

@router.get("/players/{player_id}/stats", response_model=StatsListResponse)
async def get_stats(
    player_id: uuid.UUID,
    service: TaggerService = Depends(get_tagger_service),
):
    """获取棋手统计（白/黑/总）"""
    player = service.get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    result = {}
    for scope in ["white", "black", "total"]:
        stats = service.get_stats(player_id, scope)
        if stats:
            stat = stats[0]  # 取最新的
            items = [
                TagStatItem(
                    tag_name=s.tag_name,
                    tag_count=s.tag_count,
                    total_positions=s.total_positions,
                    percentage=(s.tag_count / s.total_positions * 100) if s.total_positions > 0 else 0,
                )
                for s in stats
            ]
            result[scope] = StatsResponse(
                player_id=player_id,
                scope=scope,
                stats=items,
                engine_version=stat.engine_version,
                depth=stat.depth,
                multipv=stat.multipv,
                updated_at=stat.updated_at,
            )
    return StatsListResponse(**result)


# === Export Endpoints ===

@router.get("/players/{player_id}/exports")
async def export_stats(
    player_id: uuid.UUID,
    format: str = Query("csv", regex="^(csv|json)$"),
    upload_ids: Optional[str] = None,
    service: TaggerService = Depends(get_tagger_service),
):
    """导出统计（CSV/JSON）"""
    player = service.get_player(player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    stats = service.get_stats(player_id)

    if format == "json":
        data = [
            {
                "scope": s.scope,
                "tag_name": s.tag_name,
                "tag_count": s.tag_count,
                "total_positions": s.total_positions,
                "percentage": (s.tag_count / s.total_positions * 100) if s.total_positions > 0 else 0,
            }
            for s in stats
        ]
        return StreamingResponse(
            iter([json.dumps(data, indent=2)]),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={player_id}_stats.json"},
        )
    else:
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["scope", "tag_name", "tag_count", "total_positions", "percentage"])
        for s in stats:
            pct = (s.tag_count / s.total_positions * 100) if s.total_positions > 0 else 0
            writer.writerow([s.scope, s.tag_name, s.tag_count, s.total_positions, f"{pct:.2f}"])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={player_id}_stats.csv"},
        )
