-- Blog Module Migration: Add article-images association table
-- Run this with: psql $BLOG_DATABASE_URL -f add_article_images_table.sql

BEGIN;

-- Step 1: Add new columns to blog_images
ALTER TABLE blog_images
ADD COLUMN IF NOT EXISTS is_orphan BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marked_for_deletion_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_referenced_at TIMESTAMP;

-- Step 2: Create blog_article_images table
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

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_article_images_article
ON blog_article_images(article_id);

CREATE INDEX IF NOT EXISTS idx_article_images_image
ON blog_article_images(image_id);

-- Step 4: Migrate existing data (if article_id exists in blog_images)
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

-- Step 5: Update is_orphan status for existing images
UPDATE blog_images
SET is_orphan = CASE
    WHEN article_id IS NOT NULL THEN false
    ELSE true
END,
last_referenced_at = CASE
    WHEN article_id IS NOT NULL THEN NOW()
    ELSE NULL
END;

COMMIT;

-- Verification
SELECT 'Migration completed!' as status;
SELECT 'blog_article_images rows:' as info, COUNT(*) as count FROM blog_article_images;
SELECT 'blog_images with new fields:' as info, COUNT(*) as count FROM blog_images WHERE is_orphan IS NOT NULL;
