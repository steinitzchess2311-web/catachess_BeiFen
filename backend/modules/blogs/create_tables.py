"""
Create Blog Tables Directly

Simple script to create blog tables directly using SQLAlchemy.
Alternative to Alembic migrations for quick setup.

Usage:
    export BLOG_DATABASE_URL="postgresql://..."
    python backend/modules/blogs/create_tables.py
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from modules.blogs.db.models import Base, BlogArticle, BlogCategory


def create_blog_tables():
    """Create blog database tables and insert initial data."""

    # Get database URL
    db_url = os.getenv("BLOG_DATABASE_URL")
    if not db_url:
        print("❌ Error: BLOG_DATABASE_URL environment variable not set!")
        print("\nSet it with:")
        print("export BLOG_DATABASE_URL='postgresql://postgres:vnPFhpmxSMqmZpGSJcmshkwBKgJdqTpV@postgres-17e3b035.railway.internal:5432/railway'")
        sys.exit(1)

    print("🔧 Creating Blog Tables...")
    print(f"📍 Database: {db_url.split('@')[1].split('/')[0] if '@' in db_url else 'localhost'}\n")

    try:
        # Create engine
        engine = create_engine(db_url, echo=True)

        # Create all tables
        print("📋 Creating tables...")
        Base.metadata.create_all(engine)

        # Insert initial categories
        print("\n📝 Inserting initial categories...")
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO blog_categories (id, name, display_name, description, icon, order_index, is_active, created_at)
                VALUES
                    (gen_random_uuid(), 'about', 'About Us', 'Learn about Chessortag platform', '📖', 1, true, NOW()),
                    (gen_random_uuid(), 'function', 'Function Intro', 'Platform features and tutorials', '⚙️', 2, true, NOW()),
                    (gen_random_uuid(), 'allblogs', 'All Blogs', 'Browse all articles', '📚', 3, true, NOW()),
                    (gen_random_uuid(), 'user', 'Users'' Blogs', 'Community articles', '✍️', 4, true, NOW())
                ON CONFLICT (name) DO NOTHING
            """))
            conn.commit()

        print("\n✅ Blog tables created successfully!\n")
        print("📊 Tables created:")
        print("  ✓ blog_articles")
        print("  ✓ blog_categories")
        print("\n📝 Categories inserted:")
        print("  ✓ about (About Us)")
        print("  ✓ function (Function Intro)")
        print("  ✓ allblogs (All Blogs)")
        print("  ✓ user (Users' Blogs)")

        # Verify tables
        print("\n🔍 Verifying tables...")
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name LIKE 'blog_%'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]

            if len(tables) == 2:
                print(f"✅ Found {len(tables)} blog tables")
            else:
                print(f"⚠️  Expected 2 tables, found {len(tables)}")

            # Count categories
            result = conn.execute(text("SELECT COUNT(*) FROM blog_categories"))
            count = result.scalar()
            print(f"✅ Found {count} categories")

        print("\n🎉 Blog database setup complete!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    create_blog_tables()
