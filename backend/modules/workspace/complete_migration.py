#!/usr/bin/env python3
"""Complete database migration from scratch"""

import psycopg2
import os
import subprocess

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:yRuedDjiwzhbrBKDbIDCtCxTMzzRDQTL@yamabiko.proxy.rlwy.net:20407/railway")

# Parse connection string
url_parts = DATABASE_URL.replace("postgresql://", "").replace("postgresql+asyncpg://", "")
user_pass, host_port_db = url_parts.split("@")
user, password = user_pass.split(":")
host_port, dbname = host_port_db.split("/")
host, port = host_port.split(":")

print("=== Complete Workspace Database Migration ===")
print()
print(f"Database: {dbname} @ {host}:{port}")
print()
print("⚠️  This will:")
print("  1. Drop existing workspace tables (keeping user data)")
print("  2. Clear alembic_version")
print("  3. Run ALL migrations from scratch")
print()

response = input("Continue? (yes/no): ")
if response.lower() != "yes":
    print("Cancelled")
    exit(0)

print()

try:
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=dbname
    )
    conn.autocommit = True
    cursor = conn.cursor()

    print("Step 1: Get current tables...")
    cursor.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != 'alembic_version'
        ORDER BY tablename
    """)
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Found {len(tables)} tables: {', '.join(tables)}")
    print()

    print("Step 2: Backup users table data...")
    cursor.execute("SELECT * FROM users")
    users_data = cursor.fetchall()
    print(f"Backed up {len(users_data)} user records")
    print()

    print("Step 3: Drop all workspace tables...")
    for table in tables:
        print(f"  Dropping {table}...")
        cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
    print("✅ Tables dropped")
    print()

    print("Step 4: Clear alembic version...")
    cursor.execute("DELETE FROM alembic_version")
    print("✅ Cleared")
    print()

    print("Step 5: Run all migrations...")
    os.environ["DATABASE_URL"] = DATABASE_URL
    result = subprocess.run(
        ["/home/catadragon/Code/catachess/venv/bin/alembic", "upgrade", "head"],
        cwd="/home/catadragon/Code/catachess/backend/modules/workspace",
        capture_output=True,
        text=True
    )

    print(result.stdout)
    if result.returncode != 0:
        print("❌ Migration failed!")
        print(result.stderr)
        exit(1)

    print("✅ Migrations completed!")
    print()

    print("Step 6: Restore users data...")
    if users_data:
        for row in users_data:
            cursor.execute(
                "INSERT INTO users (id, username, created_at, updated_at) VALUES (%s, %s, %s, %s)",
                row
            )
        print(f"✅ Restored {len(users_data)} user records")
    print()

    print("Step 7: Final verification...")
    cursor.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    """)
    tables = cursor.fetchall()
    print(f"✅ Total tables: {len(tables)}")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f"   {table[0]}: {count} rows")

    cursor.execute("SELECT version_num FROM alembic_version")
    version = cursor.fetchone()
    print()
    print(f"✅ Alembic version: {version[0]}")

    cursor.close()
    conn.close()

    print()
    print("🎉 Complete migration successful!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
