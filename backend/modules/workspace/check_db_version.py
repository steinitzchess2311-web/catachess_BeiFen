#!/usr/bin/env python3
"""Check alembic version and list all tables in database"""

import psycopg2
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:yRuedDjiwzhbrBKDbIDCtCxTMzzRDQTL@yamabiko.proxy.rlwy.net:20407/railway")

# Parse connection string
# Format: postgresql://user:pass@host:port/dbname
url_parts = DATABASE_URL.replace("postgresql://", "").replace("postgresql+asyncpg://", "")
user_pass, host_port_db = url_parts.split("@")
user, password = user_pass.split(":")
host_port, dbname = host_port_db.split("/")
host, port = host_port.split(":")

print("=== Database Connection ===")
print(f"Host: {host}")
print(f"Port: {port}")
print(f"Database: {dbname}")
print(f"User: {user}")
print()

try:
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=dbname
    )
    cursor = conn.cursor()

    # Check alembic version
    print("=== Alembic Version ===")
    try:
        cursor.execute("SELECT version_num FROM alembic_version")
        version = cursor.fetchone()
        if version:
            print(f"Current version: {version[0]}")
        else:
            print("No version found (alembic_version is empty)")
    except Exception as e:
        print(f"Error reading alembic_version: {e}")
    print()

    # List all tables
    print("=== All Tables ===")
    cursor.execute("""
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    """)
    tables = cursor.fetchall()
    print(f"Total: {len(tables)} tables")
    for i, (table,) in enumerate(tables, 1):
        print(f"{i}. {table}")
    print()

    # Count rows in each table
    print("=== Table Row Counts ===")
    for (table,) in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"{table}: {count} rows")

    cursor.close()
    conn.close()
    print()
    print("✅ Connection successful!")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
