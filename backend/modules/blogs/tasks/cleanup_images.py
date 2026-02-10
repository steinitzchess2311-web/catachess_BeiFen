"""
Orphan Image Cleanup Task

This script identifies and deletes orphan images (uploaded but not linked to any article).

Cleanup Strategy:
1. Mark orphan images (not used in any article for 30+ days)
2. After 7-day grace period, delete marked images from R2 and database

Usage:
    # Mark orphan images
    python -m modules.blogs.tasks.cleanup_images mark

    # Delete marked images
    python -m modules.blogs.tasks.cleanup_images delete

    # Run complete cleanup (mark + delete)
    python -m modules.blogs.tasks.cleanup_images all

Schedule this with cron:
    # Every day at 2 AM
    0 2 * * * cd /app && python -m modules.blogs.tasks.cleanup_images all
"""
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from modules.blogs.db.image_models import BlogImage
from modules.blogs.services.image_service import get_image_service


def get_db_session() -> Session:
    """Get database session"""
    db_url = os.getenv("BLOG_DATABASE_URL")
    if not db_url:
        raise ValueError("BLOG_DATABASE_URL not set")

    engine = create_engine(db_url)
    return Session(engine)


def mark_orphan_images(orphan_threshold_days: int = 30, verbose: bool = True) -> int:
    """
    Mark orphan images for deletion

    An image is considered orphan if:
    - is_orphan = true
    - created_at > orphan_threshold_days ago
    - marked_for_deletion_at is NULL

    Args:
        orphan_threshold_days: Days since upload to consider orphan
        verbose: Print progress

    Returns:
        Number of images marked
    """
    db = get_db_session()

    try:
        cutoff_time = datetime.utcnow() - timedelta(days=orphan_threshold_days)

        # Find orphan images
        stmt = select(BlogImage).where(
            BlogImage.is_orphan == True,
            BlogImage.created_at < cutoff_time,
            BlogImage.marked_for_deletion_at == None
        )
        orphan_images = db.execute(stmt).scalars().all()

        if verbose:
            print(f"📋 Found {len(orphan_images)} orphan images older than {orphan_threshold_days} days")

        # Mark for deletion
        marked_count = 0
        for img in orphan_images:
            img.marked_for_deletion_at = datetime.utcnow()
            marked_count += 1
            if verbose:
                print(f"  🏴 Marked: {img.filename} (uploaded {img.created_at.date()})")

        db.commit()

        if verbose:
            print(f"✅ Marked {marked_count} images for deletion (grace period: 7 days)")

        return marked_count

    finally:
        db.close()


def delete_marked_images(grace_period_days: int = 7, verbose: bool = True) -> dict:
    """
    Delete images that have been marked for deletion

    Args:
        grace_period_days: Days to wait before deletion
        verbose: Print progress

    Returns:
        {
            "deleted_count": int,
            "failed_count": int,
            "total_size_bytes": int
        }
    """
    db = get_db_session()
    image_service = get_image_service()

    try:
        cutoff_time = datetime.utcnow() - timedelta(days=grace_period_days)

        # Find images marked for deletion
        stmt = select(BlogImage).where(
            BlogImage.marked_for_deletion_at < cutoff_time
        )
        images_to_delete = db.execute(stmt).scalars().all()

        if verbose:
            print(f"📋 Found {len(images_to_delete)} images marked for deletion (grace period passed)")

        deleted_count = 0
        failed_count = 0
        total_size = 0

        for img in images_to_delete:
            try:
                # Delete from R2
                success = image_service.delete_from_r2(img.storage_path)

                if success:
                    # Delete from database
                    total_size += img.size_bytes
                    db.delete(img)
                    deleted_count += 1
                    if verbose:
                        print(f"  🗑️  Deleted: {img.filename} ({img.size_bytes / 1024:.1f} KB)")
                else:
                    failed_count += 1
                    if verbose:
                        print(f"  ❌ Failed to delete from R2: {img.filename}")

            except Exception as e:
                failed_count += 1
                if verbose:
                    print(f"  ❌ Error deleting {img.filename}: {e}")

        db.commit()

        if verbose:
            print(f"✅ Deleted {deleted_count} images ({total_size / 1024 / 1024:.2f} MB)")
            if failed_count > 0:
                print(f"⚠️  Failed to delete {failed_count} images")

        return {
            "deleted_count": deleted_count,
            "failed_count": failed_count,
            "total_size_bytes": total_size
        }

    finally:
        db.close()


def get_orphan_stats(verbose: bool = True) -> dict:
    """
    Get statistics about orphan images

    Returns:
        {
            "orphan_count": int,
            "marked_count": int,
            "total_orphan_size_bytes": int
        }
    """
    db = get_db_session()

    try:
        # Count orphan images
        orphan_stmt = select(BlogImage).where(BlogImage.is_orphan == True)
        orphan_images = db.execute(orphan_stmt).scalars().all()
        orphan_count = len(orphan_images)
        total_size = sum(img.size_bytes for img in orphan_images)

        # Count marked images
        marked_stmt = select(BlogImage).where(BlogImage.marked_for_deletion_at != None)
        marked_count = db.execute(marked_stmt).scalar()

        stats = {
            "orphan_count": orphan_count,
            "marked_count": marked_count,
            "total_orphan_size_bytes": total_size
        }

        if verbose:
            print(f"📊 Orphan Image Statistics:")
            print(f"  - Total orphan images: {orphan_count}")
            print(f"  - Marked for deletion: {marked_count}")
            print(f"  - Total size: {total_size / 1024 / 1024:.2f} MB")

        return stats

    finally:
        db.close()


def cleanup_all(orphan_days: int = 30, grace_days: int = 7, verbose: bool = True):
    """
    Run complete cleanup: mark orphans + delete marked images

    Args:
        orphan_days: Days since upload to consider orphan
        grace_days: Days to wait before deletion
        verbose: Print progress
    """
    if verbose:
        print("=" * 60)
        print("🧹 Starting Orphan Image Cleanup")
        print("=" * 60)
        print()

    # Step 1: Show stats
    if verbose:
        print("📊 Current Stats:")
        get_orphan_stats(verbose=True)
        print()

    # Step 2: Mark orphan images
    if verbose:
        print("🏴 Step 1: Marking orphan images...")
    marked = mark_orphan_images(orphan_threshold_days=orphan_days, verbose=verbose)
    print()

    # Step 3: Delete marked images
    if verbose:
        print("🗑️  Step 2: Deleting marked images...")
    result = delete_marked_images(grace_period_days=grace_days, verbose=verbose)
    print()

    # Step 4: Final stats
    if verbose:
        print("📊 Final Stats:")
        get_orphan_stats(verbose=True)
        print()
        print("=" * 60)
        print("✅ Cleanup Complete")
        print("=" * 60)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Clean up orphan blog images")
    parser.add_argument(
        "action",
        choices=["mark", "delete", "stats", "all"],
        help="Action to perform"
    )
    parser.add_argument(
        "--orphan-days",
        type=int,
        default=30,
        help="Days since upload to consider orphan (default: 30)"
    )
    parser.add_argument(
        "--grace-days",
        type=int,
        default=7,
        help="Grace period before deletion (default: 7)"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress output"
    )

    args = parser.parse_args()
    verbose = not args.quiet

    try:
        if args.action == "mark":
            marked = mark_orphan_images(
                orphan_threshold_days=args.orphan_days,
                verbose=verbose
            )
            sys.exit(0)

        elif args.action == "delete":
            result = delete_marked_images(
                grace_period_days=args.grace_days,
                verbose=verbose
            )
            sys.exit(0)

        elif args.action == "stats":
            get_orphan_stats(verbose=True)
            sys.exit(0)

        elif args.action == "all":
            cleanup_all(
                orphan_days=args.orphan_days,
                grace_days=args.grace_days,
                verbose=verbose
            )
            sys.exit(0)

    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
