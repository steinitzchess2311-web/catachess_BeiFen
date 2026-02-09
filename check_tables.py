"""Quick script to check if blog tables exist"""
import os
import sys
from sqlalchemy import create_engine, text

db_url = os.getenv("BLOG_DATABASE_URL")
if not db_url:
    print("❌ BLOG_DATABASE_URL not set")
    sys.exit(1)

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'blog_%'
            ORDER BY table_name
        """))
        tables = [row[0] for row in result]

        if tables:
            print(f"✅ Found {len(tables)} blog table(s):")
            for table in tables:
                print(f"  - {table}")
        else:
            print("❌ No blog tables found")

        # Check categories
        if 'blog_categories' in tables:
            result = conn.execute(text("SELECT COUNT(*) FROM blog_categories"))
            count = result.scalar()
            print(f"\n📊 blog_categories has {count} rows")

except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
