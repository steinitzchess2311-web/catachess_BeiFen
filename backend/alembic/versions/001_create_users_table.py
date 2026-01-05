"""create users table

Revision ID: 001
Revises:
Create Date: 2026-01-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('identifier', sa.String(length=255), nullable=False),
        sa.Column('identifier_type', sa.String(length=20), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False, server_default='student'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    # Create indexes
    op.create_index('ix_users_identifier', 'users', ['identifier'], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_users_identifier', table_name='users')

    # Drop table
    op.drop_table('users')
