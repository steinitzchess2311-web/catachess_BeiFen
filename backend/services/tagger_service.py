"""
Tagger Service - 棋手管理与上传服务

职责（来自 Stage 05）：
- 接收上传 → 写 R2 → 创建 upload 记录
- 触发解析 pipeline
- 返回进度与状态
"""
import uuid
import unicodedata
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from models.tagger import PlayerProfile, PgnUpload, PgnGame, FailedGame, TagStat
from modules.tagger.errors import UploadStatus
from storage.tagger import TaggerStorage
from storage.core.client import StorageClient
from storage.core.config import StorageConfig


def normalize_name(name: str) -> str:
    """规范化棋手名称，用于模糊匹配"""
    normalized = unicodedata.normalize("NFKC", name.lower().strip())
    return "".join(c for c in normalized if c.isalnum() or c.isspace()).strip()


class TaggerService:
    """Tagger 主服务"""

    def __init__(self, db: Session, storage: Optional[TaggerStorage] = None):
        self.db = db
        self._storage = storage

    @property
    def storage(self) -> TaggerStorage:
        """延迟初始化存储"""
        if self._storage is None:
            config = StorageConfig.from_env()
            client = StorageClient(config)
            self._storage = TaggerStorage(client)
        return self._storage

    # === Player Operations ===

    def create_player(self, display_name: str, aliases: list[str] = None) -> PlayerProfile:
        """创建棋手档案"""
        player = PlayerProfile(
            display_name=display_name,
            normalized_name=normalize_name(display_name),
            aliases=aliases or [],
        )
        self.db.add(player)
        self.db.commit()
        self.db.refresh(player)
        return player

    def get_player(self, player_id: uuid.UUID) -> Optional[PlayerProfile]:
        """获取单个棋手"""
        return self.db.get(PlayerProfile, player_id)

    def list_players(self, offset: int = 0, limit: int = 50) -> tuple[list[PlayerProfile], int]:
        """获取棋手列表"""
        total = self.db.scalar(select(func.count(PlayerProfile.id)))
        players = self.db.scalars(
            select(PlayerProfile)
            .order_by(PlayerProfile.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
        return list(players), total or 0

    # === Upload Operations ===

    def create_upload(
        self,
        player_id: uuid.UUID,
        pgn_content: bytes,
        original_filename: str,
        upload_user_id: uuid.UUID,
    ) -> PgnUpload:
        """创建上传记录并存储 PGN 到 R2"""
        upload_id = uuid.uuid4()
        checksum = TaggerStorage.compute_checksum(pgn_content)

        # 写入 R2
        r2_key_raw, _ = self.storage.upload_pgn(
            player_id=player_id,
            upload_id=upload_id,
            pgn_content=pgn_content,
            original_filename=original_filename,
            upload_user_id=upload_user_id,
        )

        # 创建数据库记录
        upload = PgnUpload(
            id=upload_id,
            player_id=player_id,
            r2_key_raw=r2_key_raw,
            checksum=checksum,
            status=UploadStatus.PENDING.value,
        )
        self.db.add(upload)
        self.db.commit()
        self.db.refresh(upload)
        return upload

    def get_upload(self, upload_id: uuid.UUID) -> Optional[PgnUpload]:
        """获取上传记录"""
        return self.db.get(PgnUpload, upload_id)

    def get_upload_status(self, upload_id: uuid.UUID) -> dict:
        """获取上传状态（最小集字段）"""
        upload = self.get_upload(upload_id)
        if not upload:
            return None

        # 统计处理位置数
        processed = self.db.scalar(
            select(func.sum(PgnGame.move_count))
            .where(PgnGame.upload_id == upload_id)
        ) or 0

        # 统计失败数
        failed_count = self.db.scalar(
            select(func.count(FailedGame.id))
            .where(FailedGame.upload_id == upload_id)
        ) or 0

        return {
            "id": upload.id,
            "status": upload.status,
            "processed_positions": processed,
            "failed_games_count": failed_count,
            "last_updated": upload.updated_at,
            "needs_confirmation": upload.status == UploadStatus.NEEDS_CONFIRMATION.value,
            "match_candidates": upload.checkpoint_state.get("candidates", []) if upload.checkpoint_state else [],
        }

    # === Stats Operations ===

    def get_stats(self, player_id: uuid.UUID, scope: str = None) -> list[TagStat]:
        """获取棋手统计"""
        query = select(TagStat).where(TagStat.player_id == player_id)
        if scope:
            query = query.where(TagStat.scope == scope)
        return list(self.db.scalars(query).all())

    # === Failed Games Operations ===

    def get_failed_games(self, upload_id: uuid.UUID) -> list[FailedGame]:
        """获取失败记录"""
        return list(self.db.scalars(
            select(FailedGame)
            .where(FailedGame.upload_id == upload_id)
            .order_by(FailedGame.game_index)
        ).all())
