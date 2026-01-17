"""Align events table with current model

Revision ID: 20260112_0015
Revises: 20260112_0014
Create Date: 2026-01-12 00:15:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260112_0015"
down_revision: Union[str, None] = "20260112_0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing columns and indexes to events table."""
    op.add_column("events", sa.Column("type", sa.String(length=100), nullable=True))
    op.add_column("events", sa.Column("target_id", sa.String(length=64), nullable=True))
    op.add_column("events", sa.Column("target_type", sa.String(length=20), nullable=True))
    op.add_column(
        "events",
        sa.Column(
            "payload",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'::json"),
        ),
    )
    op.add_column(
        "events",
        sa.Column("workspace_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "events",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.add_column(
        "events",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # Backfill new columns from legacy fields when present.
    op.execute("UPDATE events SET type = event_type WHERE type IS NULL")
    op.execute("UPDATE events SET target_id = aggregate_id WHERE target_id IS NULL")
    op.execute(
        "UPDATE events SET target_type = aggregate_type WHERE target_type IS NULL"
    )
    op.execute(
        "UPDATE events SET payload = data "
        "WHERE data IS NOT NULL AND (payload IS NULL OR payload::text = '{}')"
    )
    op.execute(
        "UPDATE events SET created_at = timestamp, updated_at = timestamp "
        "WHERE created_at = now() AND updated_at = now() AND timestamp IS NOT NULL"
    )

    # Enforce required fields used by the current ORM.
    op.alter_column("events", "type", nullable=False)
    op.alter_column("events", "target_id", nullable=False)

    # New indexes expected by the ORM and queries.
    op.create_index("ix_events_target_created", "events", ["target_id", "created_at"])
    op.create_index("ix_events_actor_created", "events", ["actor_id", "created_at"])
    op.create_index(
        "ix_events_workspace_created", "events", ["workspace_id", "created_at"]
    )
    op.create_index("ix_events_type_created", "events", ["type", "created_at"])
    op.create_index("ix_events_target_version", "events", ["target_id", "version"])


def downgrade() -> None:
    """Revert events table alignment."""
    op.drop_index("ix_events_target_version", table_name="events")
    op.drop_index("ix_events_type_created", table_name="events")
    op.drop_index("ix_events_workspace_created", table_name="events")
    op.drop_index("ix_events_actor_created", table_name="events")
    op.drop_index("ix_events_target_created", table_name="events")

    op.drop_column("events", "updated_at")
    op.drop_column("events", "created_at")
    op.drop_column("events", "workspace_id")
    op.drop_column("events", "payload")
    op.drop_column("events", "target_type")
    op.drop_column("events", "target_id")
    op.drop_column("events", "type")
