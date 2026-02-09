"""
Check blog admin users
Query the database to see which users have editor/admin roles
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session


def main():
    db_url = os.getenv("DATABASE_URL") or os.getenv("BLOG_DATABASE_URL")

    if not db_url:
        print("❌ Error: DATABASE_URL or BLOG_DATABASE_URL not set")
        print("\nSet environment variable:")
        print("export DATABASE_URL='postgresql://user:password@host:port/database'")
        return

    print(f"📊 Connecting to database...")
    print(f"URL: {db_url.split('@')[0]}@***\n")

    try:
        engine = create_engine(db_url)

        with Session(engine) as session:
            # Check all users
            print("=" * 100)
            print("All Users:")
            print("=" * 100)
            result = session.execute(text("""
                SELECT id, identifier, username, role, is_active, created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT 50
            """))

            print(f"{'ID':<38} {'Identifier':<35} {'Username':<20} {'Role':<10} {'Active':<8} {'Created'}")
            print("-" * 100)

            all_users = []
            for row in result:
                user_id, identifier, username, role, is_active, created_at = row
                all_users.append({
                    'id': str(user_id),
                    'identifier': identifier,
                    'username': username or 'N/A',
                    'role': role,
                    'is_active': is_active,
                    'created_at': created_at
                })
                status = '✅' if is_active else '❌'
                print(f"{str(user_id):<38} {identifier:<35} {username or 'N/A':<20} {role:<10} {status:<8} {created_at.strftime('%Y-%m-%d %H:%M')}")

            # Check admin users
            print("\n" + "=" * 100)
            print("Admin & Editor Users:")
            print("=" * 100)
            result = session.execute(text("""
                SELECT id, identifier, username, role
                FROM users
                WHERE role IN ('admin', 'editor')
                ORDER BY role DESC, identifier
            """))

            admins = list(result)

            if admins:
                print(f"{'ID':<38} {'Identifier':<40} {'Username':<20} {'Role'}")
                print("-" * 100)
                for row in admins:
                    user_id, identifier, username, role = row
                    role_icon = '👑' if role == 'admin' else '✏️'
                    print(f"{str(user_id):<38} {identifier:<40} {username or 'N/A':<20} {role_icon} {role}")
            else:
                print("⚠️  No users with 'admin' or 'editor' roles found")
                print("\nTo set up admin users, call:")
                print("POST /api/blog-admin/setup-permissions")

            # Check hardcoded admin IDs
            print("\n" + "=" * 100)
            print("Hardcoded Admin IDs (from blog_admin.py):")
            print("=" * 100)
            admin_ids = [
                'b8693aa4-ddaa-4ed0-ab33-2f5f459e5415',
                'b171f398-ead9-4599-b4ef-0c0158d325c3'
            ]

            for admin_id in admin_ids:
                result = session.execute(
                    text("SELECT id, identifier, username, role FROM users WHERE id = :user_id"),
                    {"user_id": admin_id}
                )
                row = result.fetchone()

                if row:
                    user_id, identifier, username, role = row
                    status = '✅ Found' if role == 'admin' else f'⚠️  Found but role is {role}'
                    print(f"{status}: {identifier} ({username or 'N/A'})")
                else:
                    print(f"❌ Not found: {admin_id}")

            # Stats
            print("\n" + "=" * 100)
            print("Statistics:")
            print("=" * 100)
            result = session.execute(text("""
                SELECT role, COUNT(*) as count
                FROM users
                GROUP BY role
                ORDER BY count DESC
            """))

            print(f"{'Role':<15} {'Count'}")
            print("-" * 30)
            for row in result:
                role, count = row
                print(f"{role:<15} {count}")

            print("\n✅ Query completed successfully")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
