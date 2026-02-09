"""Create blog_images table

Revision ID: 008_create_blog_images_table
Revises: 007_create_blog_tables
Create Date: 2026-02-09 20:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008_create_blog_images_table'
down_revision = '007_create_blog_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create blog_images table
    op.create_table(
        'blog_images',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('storage_path', sa.String(500), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('content_type', sa.String(50), nullable=False),

        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),

        sa.Column('resize_mode', sa.String(20), nullable=False),
        sa.Column('image_type', sa.String(20), nullable=False),

        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('article_id', postgresql.UUID(as_uuid=True), nullable=True),

        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),

        sa.ForeignKeyConstraint(['article_id'], ['blog_articles.id'], ondelete='SET NULL'),
        sa.CheckConstraint(
            "resize_mode IN ('original', 'adaptive_width')",
            name='blog_images_resize_mode_check'
        ),
        sa.CheckConstraint(
            "image_type IN ('cover', 'content')",
            name='blog_images_image_type_check'
        ),
    )

    # Create indexes
    op.create_index('ix_blog_images_article_id', 'blog_images', ['article_id'])
    op.create_index('ix_blog_images_uploaded_by', 'blog_images', ['uploaded_by'])
    op.create_index('ix_blog_images_created_at', 'blog_images', ['created_at'])


def downgrade():
    op.drop_index('ix_blog_images_created_at', table_name='blog_images')
    op.drop_index('ix_blog_images_uploaded_by', table_name='blog_images')
    op.drop_index('ix_blog_images_article_id', table_name='blog_images')
    op.drop_table('blog_images')
