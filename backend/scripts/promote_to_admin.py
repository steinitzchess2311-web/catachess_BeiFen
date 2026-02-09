#!/usr/bin/env python3
"""
Quick script to promote a user to admin role
Usage: python promote_to_admin.py <email>
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session


def promote_to_admin(email: str):
    """Promote user to admin role"""
    db_url = os.getenv("DATABASE_URL") or os.getenv("BLOG_DATABASE_URL")

    if not db_url:
        print("❌ Error: DATABASE_URL or BLOG_DATABASE_URL not set")
        print("\nSet environment variable:")
        print("export DATABASE_URL='postgresql://user:password@host:port/database'")
        return False

    print(f"📊 Connecting to database...")
    print(f"🎯 Promoting user: {email}\n")

    try:
        engine = create_engine(db_url)

        with Session(engine) as session:
            # First check if user exists
            result = session.execute(
                text("SELECT id, identifier, username, role FROM users WHERE identifier = :email"),
                {"email": email}
            )
            user = result.fetchone()

            if not user:
                print(f"❌ User not found: {email}")
                print("\nAvailable users:")
                result = session.execute(text("SELECT identifier, username FROM users LIMIT 10"))
                for row in result:
                    print(f"  - {row[0]} ({row[1] or 'no username'})")
                return False

            user_id, identifier, username, current_role = user

            print(f"Found user:")
            print(f"  ID: {user_id}")
            print(f"  Email: {identifier}")
            print(f"  Username: {username or 'N/A'}")
            print(f"  Current Role: {current_role}")
            print()

            if current_role == 'admin':
                print(f"✅ User is already an admin!")
                return True

            # Update role to admin
            session.execute(
                text("UPDATE users SET role = 'admin' WHERE identifier = :email"),
                {"email": email}
            )
            session.commit()

            print(f"✅ Successfully promoted {email} to admin!")
            print(f"   {current_role} → admin")
            print()
            print("🎉 You can now access admin features!")

            return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python promote_to_admin.py <email>")
        print("\nExample:")
        print("  python promote_to_admin.py catadragon99@gmail.com")
        sys.exit(1)

    email = sys.argv[1]
    success = promote_to_admin(email)

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
