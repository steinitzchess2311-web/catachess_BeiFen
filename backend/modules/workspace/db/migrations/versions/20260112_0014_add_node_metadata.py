"""Add missing metadata columns to nodes

Revision ID: 20260112_0014
Revises: 20260112_0013
Create Date: 2026-01-12 00:14:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260112_0014"
down_revision: Union[str, None] = "20260112_0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add description and layout columns to nodes."""
    op.add_column("nodes", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "nodes",
        sa.Column(
            "layout",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'::json"),
        ),
    )


def downgrade() -> None:
    """Remove description and layout columns from nodes."""
    op.drop_column("nodes", "layout")
    op.drop_column("nodes", "description")
