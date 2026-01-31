"""
Verify MongoDB Data Exists

Quick script to check if data exists in MongoDB catachess.engine_cache collection.

Usage:
    cd backend
    python scripts/verify_mongodb_data.py
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient


async def verify_data():
    """Verify data exists in MongoDB"""

    print("=" * 80)
    print("MongoDB Data Verification")
    print("=" * 80)

    mongo_url = os.getenv("MONGO_URL")

    if not mongo_url:
        print("\n❌ ERROR: MONGO_URL not set")
        return False

    # Redact password for display
    display_url = mongo_url
    if "@" in display_url:
        parts = display_url.split("@")
        credentials = parts[0].split("://")[1]
        if ":" in credentials:
            user = credentials.split(":")[0]
            display_url = display_url.replace(credentials, f"{user}:***")

    print(f"\n📡 Connecting to: {display_url}")

    try:
        # Connect
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        print("✅ Connected successfully")

        # Check the catachess database specifically
        db = client['catachess']
        collection = db['engine_cache']

        print(f"\n🔍 Checking database: catachess")
        print(f"🔍 Checking collection: engine_cache")

        # Count documents
        count = await collection.count_documents({})
        print(f"\n📊 Total documents in engine_cache: {count}")

        if count == 0:
            print("\n⚠️  Collection exists but is empty")
            print("   This is normal if no analysis has been cached yet")
        else:
            print(f"\n✅ Found {count} cached positions!")

            # Get a few sample documents
            print("\n📝 Sample documents (first 3):")
            cursor = collection.find({}).limit(3)
            docs = await cursor.to_list(length=3)

            for i, doc in enumerate(docs, 1):
                print(f"\n   Document {i}:")
                print(f"      FEN: {doc.get('fen', 'N/A')[:60]}...")
                print(f"      Depth: {doc.get('depth')}, MultiPV: {doc.get('multipv')}")
                print(f"      Source: {doc.get('source')}")
                print(f"      Hit count: {doc.get('hit_count', 0)}")
                print(f"      Timestamp: {doc.get('timestamp')}")

        # List all databases
        print("\n" + "-" * 80)
        print("All databases on this MongoDB instance:")
        print("-" * 80)

        db_list = await client.list_database_names()
        for db_name in db_list:
            db_instance = client[db_name]
            collections = await db_instance.list_collection_names()
            print(f"\n📁 Database: {db_name}")
            if collections:
                for coll_name in collections:
                    coll = db_instance[coll_name]
                    coll_count = await coll.count_documents({})
                    print(f"   └─ {coll_name}: {coll_count} documents")
            else:
                print(f"   └─ (no collections)")

        print("\n" + "=" * 80)
        print("✅ Verification Complete")
        print("=" * 80)

        client.close()
        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(verify_data())
    sys.exit(0 if success else 1)
