#!/usr/bin/env python3
"""Reset alembic version and run migrations"""

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

print("=== Workspace Database Migration Reset ===")
print()
print("⚠️  WARNING: This will reset alembic version and apply all migrations")
print(f"Database: {dbname} @ {host}:{port}")
print()

response = input("Continue? (yes/no): ")
if response.lower() != "yes":
    print("Cancelled")
    exit(0)

print()
print("Step 1: Connecting to database...")
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
    print("✅ Connected")
    print()

    print("Step 2: Clearing alembic_version table...")
    cursor.execute("DELETE FROM alembic_version")
    print("✅ Cleared")
    print()

    print("Step 3: Running migrations...")
    os.environ["DATABASE_URL"] = DATABASE_URL
    result = subprocess.run(
        ["/home/catadragon/Code/catachess/venv/bin/alembic", "upgrade", "head"],
        cwd="/home/catadragon/Code/catachess/backend/modules/workspace",
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        print("✅ Migrations applied successfully!")
        print()
        print(result.stdout)
    else:
        print("❌ Migration failed!")
        print(result.stderr)
        exit(1)

    print()
    print("Step 4: Checking final state...")
    cursor.execute("SELECT version_num FROM alembic_version")
    version = cursor.fetchone()
    print(f"✅ Current version: {version[0] if version else 'None'}")
    print()

    cursor.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    """)
    tables = cursor.fetchall()
    print(f"✅ Total tables: {len(tables)}")
    for table in tables:
        print(f"   - {table[0]}")

    cursor.close()
    conn.close()

    print()
    print("🎉 Migration complete!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
