#!/usr/bin/env python3
"""Fix migration state by setting to correct version"""

import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:yRuedDjiwzhbrBKDbIDCtCxTMzzRDQTL@yamabiko.proxy.rlwy.net:20407/railway")

# Parse connection string
url_parts = DATABASE_URL.replace("postgresql://", "").replace("postgresql+asyncpg://", "")
user_pass, host_port_db = url_parts.split("@")
user, password = user_pass.split(":")
host_port, dbname = host_port_db.split("/")
host, port = host_port.split(":")

print("=== Fix Migration State ===")
print()
print(f"Database: {dbname} @ {host}:{port}")
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

    # Check existing tables
    print("Step 1: Check existing tables...")
    cursor.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    """)
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table}")
    print()

    # Since only users and alembic_version exist,
    # we set version to 20260112_0007 (which creates users table)
    # This way, next migrations will create all other tables

    print("Step 2: Set alembic version to 20260112_0007...")
    print("(This marks 'users' table creation as done)")
    cursor.execute("DELETE FROM alembic_version")
    cursor.execute("INSERT INTO alembic_version (version_num) VALUES ('20260112_0007')")
    print("✅ Version set")
    print()

    cursor.execute("SELECT version_num FROM alembic_version")
    version = cursor.fetchone()[0]
    print(f"Current version: {version}")
    print()

    print("✅ Done! Now run:")
    print("   cd /home/catadragon/Code/catachess/backend/modules/workspace")
    print("   export DATABASE_URL='postgresql://postgres:yRuedDjiwzhbrBKDbIDCtCxTMzzRDQTL@yamabiko.proxy.rlwy.net:20407/railway'")
    print("   /home/catadragon/Code/catachess/venv/bin/alembic upgrade head")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
