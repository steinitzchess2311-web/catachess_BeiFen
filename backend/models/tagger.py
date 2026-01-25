"""
Tagger ORM Models

定义 tagger 模块的数据库表（来自 Stage 04）：
- player_profiles: 棋手档案
- pgn_uploads: 上传记录
- pgn_games: 对局记录
- failed_games: 失败记录
- tag_stats: 标签统计
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db.base import Base


class PlayerProfile(Base):
    """棋手档案表"""
    __tablename__ = "player_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    aliases: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    uploads: Mapped[list["PgnUpload"]] = relationship("PgnUpload", back_populates="player")
    games: Mapped[list["PgnGame"]] = relationship("PgnGame", back_populates="player")
    stats: Mapped[list["TagStat"]] = relationship("TagStat", back_populates="player")


class PgnUpload(Base):
    """PGN 上传记录表"""
    __tablename__ = "pgn_uploads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    r2_key_raw: Mapped[str] = mapped_column(String(500), nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    checkpoint_state: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    player: Mapped["PlayerProfile"] = relationship("PlayerProfile", back_populates="uploads")
    games: Mapped[list["PgnGame"]] = relationship("PgnGame", back_populates="upload")
    failed_games: Mapped[list["FailedGame"]] = relationship("FailedGame", back_populates="upload")


class PgnGame(Base):
    """对局记录表"""
    __tablename__ = "pgn_games"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False)
    upload_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pgn_uploads.id", ondelete="CASCADE"), nullable=False, index=True)
    game_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    white_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    black_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    player_color: Mapped[str] = mapped_column(String(10), nullable=False)  # white/black
    game_result: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    move_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    player: Mapped["PlayerProfile"] = relationship("PlayerProfile", back_populates="games")
    upload: Mapped["PgnUpload"] = relationship("PgnUpload", back_populates="games")

    __table_args__ = (
        UniqueConstraint("player_id", "game_hash", name="uq_pgn_games_player_game"),
    )


class FailedGame(Base):
    """失败记录表"""
    __tablename__ = "failed_games"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False)
    upload_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pgn_uploads.id", ondelete="CASCADE"), nullable=False)
    game_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    game_index: Mapped[int] = mapped_column(Integer, nullable=False)
    headers: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    player_color: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    move_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_code: Mapped[str] = mapped_column(String(50), nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_attempt_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    upload: Mapped["PgnUpload"] = relationship("PgnUpload", back_populates="failed_games")

    __table_args__ = (
        Index("ix_failed_games_player_upload", "player_id", "upload_id"),
    )


class TagStat(Base):
    """标签统计表"""
    __tablename__ = "tag_stats"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    player_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("player_profiles.id", ondelete="CASCADE"), nullable=False)
    scope: Mapped[str] = mapped_column(String(10), nullable=False)  # white/black/total
    tag_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tag_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_positions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    engine_version: Mapped[str] = mapped_column(String(50), nullable=False)
    depth: Mapped[int] = mapped_column(Integer, nullable=False)
    multipv: Mapped[int] = mapped_column(Integer, nullable=False)
    stats_version: Mapped[str] = mapped_column(String(20), nullable=False, default="1")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    player: Mapped["PlayerProfile"] = relationship("PlayerProfile", back_populates="stats")

    __table_args__ = (
        Index("ix_tag_stats_player_scope", "player_id", "scope"),
        UniqueConstraint("player_id", "scope", "tag_name", "stats_version", "engine_version", "depth", "multipv", name="uq_tag_stats_unique"),
    )
