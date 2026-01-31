"""
Test MongoDB Connection and Schema

Run this script to verify MongoDB cache is working correctly.

Usage:
    cd backend
    python scripts/test_mongodb.py
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient


async def test_mongodb():
    """Test MongoDB connection and schema"""

    print("=" * 80)
    print("MongoDB Connection Test")
    print("=" * 80)

    # Get MongoDB URL from environment
    import os
    mongo_url = os.getenv("MONGO_URL")

    if not mongo_url:
        print("\n❌ ERROR: MONGO_URL environment variable not set")
        print("\nPlease set MONGO_URL:")
        print("  export MONGO_URL='mongodb://...'")
        print("\nOr for Railway internal:")
        print("  export MONGO_URL='mongodb://mongo:password@mongodb.railway.internal:27017'")
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

        # Test connection
        await client.admin.command('ping')
        print("✅ Connection successful!")

        # Get database
        db = client['catachess']
        collection = db['engine_cache']

        print(f"\n📊 Database: catachess")
        print(f"📋 Collection: engine_cache")

        # Check if collection exists
        collections = await db.list_collection_names()
        if 'engine_cache' in collections:
            print("✅ Collection exists")

            # Get collection stats
            stats = await db.command("collStats", "engine_cache")
            count = stats.get("count", 0)
            size_bytes = stats.get("size", 0)
            size_mb = size_bytes / (1024 * 1024)

            print(f"\n📈 Current Stats:")
            print(f"   - Documents: {count}")
            print(f"   - Size: {size_mb:.2f} MB")

        else:
            print("⚠️  Collection does not exist yet (will be created on first insert)")

        # Check indexes
        print(f"\n🔍 Indexes:")
        indexes = await collection.list_indexes().to_list(length=100)

        if indexes:
            for idx in indexes:
                name = idx.get('name', 'unknown')
                keys = idx.get('key', {})
                unique = idx.get('unique', False)
                ttl = idx.get('expireAfterSeconds')

                print(f"   - {name}")
                print(f"     Keys: {dict(keys)}")
                if unique:
                    print(f"     Unique: Yes")
                if ttl:
                    print(f"     TTL: {ttl}s ({ttl/86400:.0f} days)")
        else:
            print("   ⚠️  No indexes found (will be created by app on startup)")

        # Test write and read
        print(f"\n🧪 Testing write/read operations...")

        test_doc = {
            "cache_key": "test_key_12345",
            "fen": "test_fen",
            "depth": 14,
            "multipv": 3,
            "engine_mode": "test",
            "lines": [{"multipv": 1, "score": 25, "pv": ["e2e4"]}],
            "source": "test",
            "timestamp": "2026-01-30T00:00:00Z",
            "hit_count": 0,
        }

        # Insert
        await collection.insert_one(test_doc)
        print("✅ Write successful")

        # Read
        result = await collection.find_one({"cache_key": "test_key_12345"})
        if result:
            print("✅ Read successful")
        else:
            print("❌ Read failed")

        # Delete test doc
        await collection.delete_one({"cache_key": "test_key_12345"})
        print("✅ Delete successful")

        # Summary
        print("\n" + "=" * 80)
        print("✅ MongoDB Cache System: READY")
        print("=" * 80)

        client.close()
        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nPossible issues:")
        print("  1. MongoDB service not running")
        print("  2. Incorrect MONGO_URL")
        print("  3. Network connectivity issues")
        print("  4. Authentication failure")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_mongodb())
    sys.exit(0 if success else 1)
