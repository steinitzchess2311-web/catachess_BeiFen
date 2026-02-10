"""
Database Migration: Add blog_article_images table and update blog_images

This migration:
1. Creates blog_article_images table (many-to-many relationship)
2. Adds is_orphan, marked_for_deletion_at, last_referenced_at to blog_images
3. Removes article_id from blog_images (moved to association table)

Run this migration:
    python backend/modules/blogs/migrations/add_article_images_table.py
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text


def run_migration():
    """Execute the migration"""
    db_url = os.getenv("BLOG_DATABASE_URL")
    if not db_url:
        print("❌ BLOG_DATABASE_URL not set")
        sys.exit(1)

    engine = create_engine(db_url)

    print("🚀 Starting migration...")

    with engine.begin() as conn:
        # Step 1: Add new columns to blog_images
        print("📝 Step 1: Adding columns to blog_images...")
        conn.execute(text("""
            ALTER TABLE blog_images
            ADD COLUMN IF NOT EXISTS is_orphan BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS marked_for_deletion_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS last_referenced_at TIMESTAMP;
        """))

        # Step 2: Create blog_article_images table
        print("📝 Step 2: Creating blog_article_images table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS blog_article_images (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                article_id UUID NOT NULL,
                image_id UUID NOT NULL,
                position INTEGER,
                usage_context VARCHAR(20) NOT NULL DEFAULT 'content',
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),

                CONSTRAINT blog_article_images_usage_check
                CHECK (usage_context IN ('content', 'cover')),

                CONSTRAINT blog_article_images_unique
                UNIQUE (article_id, image_id)
            );
        """))

        # Step 3: Create indexes
        print("📝 Step 3: Creating indexes...")
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_article_images_article
            ON blog_article_images(article_id);

            CREATE INDEX IF NOT EXISTS idx_article_images_image
            ON blog_article_images(image_id);
        """))

        # Step 4: Migrate existing data (if article_id exists in blog_images)
        print("📝 Step 4: Migrating existing data...")
        conn.execute(text("""
            INSERT INTO blog_article_images (article_id, image_id, usage_context, created_at)
            SELECT
                article_id,
                id as image_id,
                CASE
                    WHEN image_type = 'cover' THEN 'cover'
                    ELSE 'content'
                END as usage_context,
                created_at
            FROM blog_images
            WHERE article_id IS NOT NULL
            ON CONFLICT (article_id, image_id) DO NOTHING;
        """))

        # Step 5: Update is_orphan status for existing images
        print("📝 Step 5: Updating orphan status...")
        conn.execute(text("""
            UPDATE blog_images
            SET is_orphan = CASE
                WHEN article_id IS NOT NULL THEN false
                ELSE true
            END,
            last_referenced_at = CASE
                WHEN article_id IS NOT NULL THEN NOW()
                ELSE NULL
            END;
        """))

        # Step 6: Drop article_id column (optional - keep for backward compatibility)
        # Uncomment if you want to remove it completely
        # print("📝 Step 6: Dropping article_id column from blog_images...")
        # conn.execute(text("""
        #     ALTER TABLE blog_images DROP COLUMN IF EXISTS article_id;
        # """))

    print("✅ Migration completed successfully!")
    print("\n📊 Summary:")
    print("  - Added: is_orphan, marked_for_deletion_at, last_referenced_at to blog_images")
    print("  - Created: blog_article_images table")
    print("  - Migrated: Existing article-image relationships")
    print("  - Indexes: Created for performance")


if __name__ == "__main__":
    run_migration()
