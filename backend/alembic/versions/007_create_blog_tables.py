"""Create blog tables

Revision ID: 007_create_blog_tables
Revises: 006_create_tagger_tables
Create Date: 2026-02-09 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_create_blog_tables'
down_revision = '006_create_tagger_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create blog_articles table
    op.create_table(
        'blog_articles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('subtitle', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('cover_image_url', sa.Text(), nullable=True),

        sa.Column('author_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('author_name', sa.String(100), nullable=False, server_default='Chessortag Team'),
        sa.Column('author_type', sa.String(20), nullable=False, server_default='official'),

        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('sub_category', sa.String(50), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.Text()), nullable=True),

        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('pin_order', sa.Integer(), nullable=False, server_default='0'),

        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('like_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('comment_count', sa.Integer(), nullable=False, server_default='0'),

        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('published_at', sa.DateTime(), nullable=True),

        sa.CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name='blog_articles_status_check'
        ),
        sa.CheckConstraint(
            "author_type IN ('official', 'user')",
            name='blog_articles_author_type_check'
        ),
    )

    # Create indexes for blog_articles
    op.create_index('ix_blog_articles_title', 'blog_articles', ['title'])
    op.create_index('ix_blog_articles_author_id', 'blog_articles', ['author_id'])
    op.create_index('ix_blog_articles_category', 'blog_articles', ['category'])
    op.create_index('ix_blog_articles_status', 'blog_articles', ['status'])
    op.create_index('ix_blog_articles_is_pinned', 'blog_articles', ['is_pinned'])
    op.create_index('ix_blog_articles_published_at', 'blog_articles', ['published_at'])

    # Create composite index for pinned articles ordering
    op.create_index(
        'ix_blog_articles_pinned_order',
        'blog_articles',
        ['is_pinned', 'pin_order'],
        postgresql_ops={'pin_order': 'DESC'}
    )

    # Create full-text search index
    op.execute("""
        CREATE INDEX ix_blog_articles_search ON blog_articles
        USING gin(to_tsvector('english', title || ' ' || COALESCE(subtitle, '') || ' ' || content))
    """)

    # Create blog_categories table
    op.create_table(
        'blog_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(50), unique=True, nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Create indexes for blog_categories
    op.create_index('ix_blog_categories_name', 'blog_categories', ['name'], unique=True)
    op.create_index('ix_blog_categories_order_index', 'blog_categories', ['order_index'])

    # Insert initial categories
    op.execute("""
        INSERT INTO blog_categories (id, name, display_name, description, icon, order_index, is_active, created_at)
        VALUES
            (gen_random_uuid(), 'about', 'About Us', 'Learn about Chessortag platform', '📖', 1, true, NOW()),
            (gen_random_uuid(), 'function', 'Function Intro', 'Platform features and tutorials', '⚙️', 2, true, NOW()),
            (gen_random_uuid(), 'allblogs', 'All Blogs', 'Browse all articles', '📚', 3, true, NOW()),
            (gen_random_uuid(), 'user', 'Users'' Blogs', 'Community articles', '✍️', 4, true, NOW())
    """)


def downgrade():
    # Drop blog_categories table
    op.drop_index('ix_blog_categories_order_index', table_name='blog_categories')
    op.drop_index('ix_blog_categories_name', table_name='blog_categories')
    op.drop_table('blog_categories')

    # Drop blog_articles indexes
    op.execute("DROP INDEX IF EXISTS ix_blog_articles_search")
    op.drop_index('ix_blog_articles_pinned_order', table_name='blog_articles')
    op.drop_index('ix_blog_articles_published_at', table_name='blog_articles')
    op.drop_index('ix_blog_articles_is_pinned', table_name='blog_articles')
    op.drop_index('ix_blog_articles_status', table_name='blog_articles')
    op.drop_index('ix_blog_articles_category', table_name='blog_articles')
    op.drop_index('ix_blog_articles_author_id', table_name='blog_articles')
    op.drop_index('ix_blog_articles_title', table_name='blog_articles')

    # Drop blog_articles table
    op.drop_table('blog_articles')
