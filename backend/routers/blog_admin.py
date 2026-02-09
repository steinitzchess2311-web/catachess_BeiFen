"""
Temporary Blog Admin Router for Database Initialization
"""
from fastapi import APIRouter, HTTPException
from sqlalchemy import create_engine, text
import os

router = APIRouter(prefix="/api/blog-admin", tags=["Blog Admin"])


@router.post("/init-database")
async def initialize_blog_database():
    """
    Initialize blog database tables - ONE TIME USE ONLY
    Creates blog_articles and blog_categories tables with initial data
    """
    try:
        db_url = os.getenv("BLOG_DATABASE_URL")
        if not db_url:
            raise HTTPException(status_code=500, detail="BLOG_DATABASE_URL not configured")

        engine = create_engine(db_url)

        # Import models to register them
        from modules.blogs.db.models import Base

        # Create all tables
        Base.metadata.create_all(engine)

        # Insert initial categories
        with engine.connect() as conn:
            # Check if categories already exist
            result = conn.execute(text("SELECT COUNT(*) FROM blog_categories"))
            count = result.scalar()

            if count == 0:
                conn.execute(text("""
                    INSERT INTO blog_categories (id, name, display_name, description, icon, order_index, is_active, created_at)
                    VALUES
                        (gen_random_uuid(), 'about', 'About Us', 'Learn about Chessortag platform', '📖', 1, true, NOW()),
                        (gen_random_uuid(), 'function', 'Function Intro', 'Platform features and tutorials', '⚙️', 2, true, NOW()),
                        (gen_random_uuid(), 'allblogs', 'All Blogs', 'Browse all articles', '📚', 3, true, NOW()),
                        (gen_random_uuid(), 'user', 'Users'' Blogs', 'Community articles', '✍️', 4, true, NOW())
                """))
                conn.commit()
                categories_msg = "✅ 4 categories inserted"
            else:
                categories_msg = f"ℹ️  {count} categories already exist"

        # Verify tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name LIKE 'blog_%'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]

            result = conn.execute(text("SELECT COUNT(*) FROM blog_categories"))
            cat_count = result.scalar()

        return {
            "success": True,
            "message": "Blog database initialized successfully",
            "tables_created": tables,
            "categories_count": cat_count,
            "details": categories_msg
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database initialization failed: {str(e)}")


@router.get("/check-tables")
async def check_blog_tables():
    """Check if blog tables exist"""
    try:
        db_url = os.getenv("BLOG_DATABASE_URL")
        if not db_url:
            return {"error": "BLOG_DATABASE_URL not configured"}

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

            category_count = 0
            if 'blog_categories' in tables:
                result = conn.execute(text("SELECT COUNT(*) FROM blog_categories"))
                category_count = result.scalar()

        return {
            "tables_found": tables,
            "table_count": len(tables),
            "category_count": category_count,
            "status": "initialized" if len(tables) == 2 else "not_initialized"
        }

    except Exception as e:
        return {"error": str(e)}


@router.post("/setup-permissions")
async def setup_user_permissions():
    """
    Setup user permissions for blog management - ONE TIME USE
    1. Modify users table to allow 'editor' and 'admin' roles
    2. Set specified users as admin
    """
    try:
        db_url = os.getenv("BLOG_DATABASE_URL")
        if not db_url:
            raise HTTPException(status_code=500, detail="BLOG_DATABASE_URL not configured")

        engine = create_engine(db_url)

        with engine.connect() as conn:
            # Step 1: Drop old constraint if exists
            conn.execute(text("""
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check
            """))
            conn.commit()

            # Step 2: Add new constraint with editor and admin roles
            conn.execute(text("""
                ALTER TABLE users ADD CONSTRAINT users_role_check
                CHECK (role IN ('student', 'teacher', 'editor', 'admin'))
            """))
            conn.commit()

            # Step 3: Set specified users as admin
            admin_ids = [
                'b8693aa4-ddaa-4ed0-ab33-2f5f459e5415',
                'b171f398-ead9-4599-b4ef-0c0158d325c3'
            ]

            for user_id in admin_ids:
                conn.execute(
                    text("UPDATE users SET role = 'admin' WHERE id = :user_id"),
                    {"user_id": user_id}
                )
            conn.commit()

            # Step 4: Verify changes
            result = conn.execute(text("""
                SELECT id, identifier, role
                FROM users
                WHERE id IN ('b8693aa4-ddaa-4ed0-ab33-2f5f459e5415', 'b171f398-ead9-4599-b4ef-0c0158d325c3')
            """))
            admins = [{"id": row[0], "identifier": row[1], "role": row[2]} for row in result]

        return {
            "success": True,
            "message": "User permissions setup successfully",
            "constraint_updated": True,
            "allowed_roles": ["student", "teacher", "editor", "admin"],
            "admins_set": admins
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Permission setup failed: {str(e)}")
