"""
Create Blog Tables in Main Database

This script creates blog tables in the main application database (not a separate blog DB).
Run this after updating blog module to use shared database.

Usage:
    export DATABASE_URL="postgresql://..."
    python backend/modules/blogs/create_tables_main_db.py

Or with explicit URL:
    DATABASE_URL="postgresql://..." python backend/modules/blogs/create_tables_main_db.py
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from modules.blogs.db.models import Base, BlogArticle, BlogCategory
from modules.blogs.db.image_models import BlogImage


def create_blog_tables():
    """Create blog database tables in main database and insert initial data."""

    # Get database URL from main app config
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Error: DATABASE_URL environment variable not set!")
        print("\nThis script uses the main application database.")
        print("Set DATABASE_URL with:")
        print("export DATABASE_URL='postgresql://user:password@host:port/database'")
        sys.exit(1)

    print("🔧 Creating Blog Tables in Main Database...")
    print(f"📍 Database: {db_url.split('@')[1].split('/')[0] if '@' in db_url else 'localhost'}\n")

    try:
        # Create engine
        engine = create_engine(db_url, echo=True)

        # Create all blog tables
        print("📋 Creating blog tables...")
        Base.metadata.create_all(engine)

        # Create blog_images table
        print("📋 Creating blog_images table...")
        from modules.blogs.db.image_models import Base as ImageBase
        ImageBase.metadata.create_all(engine)

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

        print("\n✅ Blog tables created successfully in main database!\n")
        print("📊 Tables created:")
        print("  ✓ blog_articles")
        print("  ✓ blog_categories")
        print("  ✓ blog_images")
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

            if len(tables) >= 3:
                print(f"✅ Found {len(tables)} blog tables: {', '.join(tables)}")
            else:
                print(f"⚠️  Expected 3 tables, found {len(tables)}: {', '.join(tables)}")

            # Count categories
            result = conn.execute(text("SELECT COUNT(*) FROM blog_categories"))
            count = result.scalar()
            print(f"✅ Found {count} categories")

        print("\n🎉 Blog database setup complete!")
        print("\n📌 Next steps:")
        print("  1. Restart your backend server to load the changes")
        print("  2. Test creating a blog article")
        print("  3. Check that you don't get logged out after publishing")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    create_blog_tables()
