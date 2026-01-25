"""create tagger tables

Revision ID: 006
Revises: 005
Create Date: 2026-01-25

Tables:
- player_profiles: 棋手档案
- pgn_uploads: 上传记录
- pgn_games: 对局记录
- failed_games: 失败记录
- tag_stats: 标签统计
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB


revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) player_profiles
    op.create_table(
        'player_profiles',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('display_name', sa.String(200), nullable=False),
        sa.Column('normalized_name', sa.String(200), nullable=False),
        sa.Column('aliases', ARRAY(sa.Text), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_player_profiles_normalized_name', 'player_profiles', ['normalized_name'])

    # 2) pgn_uploads
    op.create_table(
        'pgn_uploads',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('player_id', UUID(as_uuid=True), sa.ForeignKey('player_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('r2_key_raw', sa.String(500), nullable=False),
        sa.Column('checksum', sa.String(64), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('checkpoint_state', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_pgn_uploads_player_id', 'pgn_uploads', ['player_id'])

    # 3) pgn_games
    op.create_table(
        'pgn_games',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('player_id', UUID(as_uuid=True), sa.ForeignKey('player_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('upload_id', UUID(as_uuid=True), sa.ForeignKey('pgn_uploads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('game_hash', sa.String(64), nullable=False),
        sa.Column('white_name', sa.String(200), nullable=True),
        sa.Column('black_name', sa.String(200), nullable=True),
        sa.Column('player_color', sa.String(10), nullable=False),
        sa.Column('game_result', sa.String(10), nullable=True),
        sa.Column('move_count', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_pgn_games_upload_id', 'pgn_games', ['upload_id'])
    op.create_unique_constraint('uq_pgn_games_player_game', 'pgn_games', ['player_id', 'game_hash'])

    # 4) failed_games
    op.create_table(
        'failed_games',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('player_id', UUID(as_uuid=True), sa.ForeignKey('player_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('upload_id', UUID(as_uuid=True), sa.ForeignKey('pgn_uploads.id', ondelete='CASCADE'), nullable=False),
        sa.Column('game_hash', sa.String(64), nullable=True),
        sa.Column('game_index', sa.Integer(), nullable=False),
        sa.Column('headers', JSONB, nullable=True),
        sa.Column('player_color', sa.String(10), nullable=True),
        sa.Column('move_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_code', sa.String(50), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_attempt_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_failed_games_player_upload', 'failed_games', ['player_id', 'upload_id'])

    # 5) tag_stats
    op.create_table(
        'tag_stats',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('player_id', UUID(as_uuid=True), sa.ForeignKey('player_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('scope', sa.String(10), nullable=False),
        sa.Column('tag_name', sa.String(100), nullable=False),
        sa.Column('tag_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_positions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('engine_version', sa.String(50), nullable=False),
        sa.Column('depth', sa.Integer(), nullable=False),
        sa.Column('multipv', sa.Integer(), nullable=False),
        sa.Column('stats_version', sa.String(20), nullable=False, server_default='1'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tag_stats_player_scope', 'tag_stats', ['player_id', 'scope'])
    op.create_unique_constraint(
        'uq_tag_stats_unique', 'tag_stats',
        ['player_id', 'scope', 'tag_name', 'stats_version', 'engine_version', 'depth', 'multipv']
    )


def downgrade() -> None:
    op.drop_table('tag_stats')
    op.drop_table('failed_games')
    op.drop_table('pgn_games')
    op.drop_table('pgn_uploads')
    op.drop_table('player_profiles')
