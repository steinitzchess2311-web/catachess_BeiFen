"""Relax legacy events columns to avoid insert failures

Revision ID: 20260112_0016
Revises: 20260112_0015
Create Date: 2026-01-12 00:16:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260112_0016"
down_revision: Union[str, None] = "20260112_0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Allow legacy columns to be NULL after schema alignment."""
    op.alter_column("events", "event_type", nullable=True)
    op.alter_column("events", "aggregate_type", nullable=True)
    op.alter_column("events", "aggregate_id", nullable=True)
    op.alter_column("events", "data", nullable=True)
    op.alter_column("events", "timestamp", nullable=True)


def downgrade() -> None:
    """Restore legacy NOT NULL constraints."""
    op.alter_column("events", "timestamp", nullable=False)
    op.alter_column("events", "data", nullable=False)
    op.alter_column("events", "aggregate_id", nullable=False)
    op.alter_column("events", "aggregate_type", nullable=False)
    op.alter_column("events", "event_type", nullable=False)
