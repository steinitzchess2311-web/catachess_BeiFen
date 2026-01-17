"""add is_verified to users and create game_actions table

Revision ID: 005
Revises: 004
Create Date: 2026-01-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    user_columns = {col["name"] for col in inspector.get_columns("users")}
    if "is_verified" not in user_columns:
        op.add_column(
            "users",
            sa.Column(
                "is_verified", sa.Boolean(), nullable=False, server_default="false"
            ),
        )
        op.alter_column("users", "is_verified", server_default=None)

    if "game_actions" not in inspector.get_table_names():
        op.create_table(
            "game_actions",
            sa.Column(
                "id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False
            ),
            sa.Column("game_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("sequence", sa.Integer(), nullable=False),
            sa.Column("action_type", sa.String(length=50), nullable=False),
            sa.Column(
                "payload",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'::json"),
            ),
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.ForeignKeyConstraint(["game_id"], ["games.game_id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.UniqueConstraint(
                "game_id", "sequence", name="uq_game_actions_game_sequence"
            ),
        )
        op.create_index("ix_game_actions_game_id", "game_actions", ["game_id"])
        op.create_index("ix_game_actions_user_id", "game_actions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_game_actions_user_id", table_name="game_actions")
    op.drop_index("ix_game_actions_game_id", table_name="game_actions")
    op.drop_table("game_actions")
    op.drop_column("users", "is_verified")
