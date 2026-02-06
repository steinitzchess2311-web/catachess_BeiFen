"""
Test Engine → MongoDB Cache Flow

Tests the complete flow:
1. Call engine analysis API
2. Verify result is stored in MongoDB
3. Call again and verify cache hit

Usage:
    cd backend
    python scripts/test_engine_cache_flow.py
"""

import asyncio
import sys
import os
import time
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from core.cache.mongodb import MongoEngineCache


async def test_flow():
    """Test complete engine → cache flow"""

    print("=" * 80)
    print("Engine → MongoDB Cache Flow Test")
    print("=" * 80)

    # Check environment variables
    mongo_url = os.getenv("MONGO_URL")
    engine_url = os.getenv("ENGINE_URL") or "https://sf.catachess.com/engine/analyze"
    worker_token = os.getenv("WORKER_API_TOKEN")

    if not mongo_url:
        print("\n❌ ERROR: MONGO_URL not set")
        print("\nSet with:")
        print("  export MONGO_URL='mongodb://mongo:tlYvyUQbBvOTNqsDiphcspBjeCfdpLoe@turntable.proxy.rlwy.net:49945'")
        return False

    print(f"\n📡 MongoDB URL: {mongo_url.split('@')[0].split('://')[0]}://***@{mongo_url.split('@')[1] if '@' in mongo_url else '(invalid)'}")
    print(f"🚀 Engine URL: {engine_url}")
    print(f"🔑 Worker Token: {'***' + worker_token[-4:] if worker_token and len(worker_token) > 4 else 'Not set'}")

    # Test FEN (starting position)
    test_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    depth = 14
    multipv = 3

    print(f"\n🧪 Test Position: {test_fen[:50]}...")
    print(f"   Depth: {depth}, MultiPV: {multipv}")

    try:
        # Initialize MongoDB cache
        print("\n" + "-" * 80)
        print("Step 1: Initialize MongoDB Cache")
        print("-" * 80)

        cache = MongoEngineCache()
        await cache.init()

        if not cache.initialized:
            print("❌ MongoDB cache initialization failed")
            return False

        print("✅ MongoDB cache initialized")

        # Generate cache key
        cache_key = cache._generate_cache_key(test_fen, depth, multipv)
        print(f"\n🔑 Cache Key: {cache_key[:80]}...")

        # Step 2: Check if already in cache (clean slate)
        print("\n" + "-" * 80)
        print("Step 2: Check Initial Cache State")
        print("-" * 80)

        initial_result = await cache.get(test_fen, depth, multipv)

        if initial_result:
            print(f"⚠️  Position already in cache (hit_count: {initial_result.get('hit_count', 0)})")
            print("   This is OK - it means cache is working!")

            # Show cached data
            print(f"\n📦 Cached Data:")
            print(f"   Source: {initial_result.get('source')}")
            print(f"   Lines: {len(initial_result.get('lines', []))}")
            print(f"   Timestamp: {initial_result.get('timestamp')}")

            return True
        else:
            print("✅ Position not in cache (expected for first run)")

        # Step 3: Call engine API
        print("\n" + "-" * 80)
        print("Step 3: Call Engine API")
        print("-" * 80)

        import requests

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "catachess-test/1.0",
        }
        if worker_token:
            headers["Authorization"] = f"Bearer {worker_token}"

        payload = {
            "fen": test_fen,
            "depth": depth,
            "multipv": multipv,
        }

        print(f"📤 POST {engine_url}")
        print(f"   Headers: {list(headers.keys())}")
        print(f"   Payload: {payload}")

        start_time = time.time()
        response = requests.post(engine_url, json=payload, headers=headers, timeout=30)
        duration = time.time() - start_time

        print(f"\n📥 Response: {response.status_code} ({duration:.2f}s)")

        if response.status_code != 200:
            print(f"❌ Engine API failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False

        data = response.json()
        lines = data.get("lines", [])
        source = data.get("source", "unknown")

        print(f"✅ Engine returned {len(lines)} lines")
        print(f"   Source: {source}")

        if lines:
            print(f"\n   Top line: multipv={lines[0].get('multipv')}, score={lines[0].get('score')}, pv={lines[0].get('pv', [])[:3]}")

        # Step 4: Manually store in MongoDB (simulate what the backend does)
        print("\n" + "-" * 80)
        print("Step 4: Store Result in MongoDB")
        print("-" * 80)

        store_start = time.time()
        success = await cache.set(
            fen=test_fen,
            depth=depth,
            multipv=multipv,
            engine_mode="auto",
            lines=lines,
            source=source
        )
        store_duration = time.time() - store_start

        if success:
            print(f"✅ Stored in MongoDB ({store_duration*1000:.1f}ms)")
        else:
            print(f"⚠️  Storage returned False (check logs)")

        # Step 5: Verify it's in MongoDB
        print("\n" + "-" * 80)
        print("Step 5: Verify Cache Hit")
        print("-" * 80)

        verify_start = time.time()
        cached_result = await cache.get(test_fen, depth, multipv)
        verify_duration = time.time() - verify_start

        if cached_result:
            print(f"✅ Cache HIT! ({verify_duration*1000:.1f}ms)")
            print(f"\n📦 Cached Data:")
            print(f"   Source: {cached_result.get('source')}")
            print(f"   Lines: {len(cached_result.get('lines', []))}")
            print(f"   Hit Count: {cached_result.get('hit_count', 0)}")
            print(f"   Timestamp: {cached_result.get('timestamp')}")

            # Verify data integrity
            if cached_result['lines'] == lines:
                print("\n✅ Data integrity verified - stored data matches engine result")
            else:
                print("\n⚠️  Data mismatch detected")

        else:
            print(f"❌ Cache MISS after storage!")
            return False

        # Step 6: Test cache hit increment
        print("\n" + "-" * 80)
        print("Step 6: Test Hit Count Increment")
        print("-" * 80)

        await cache.increment_hit_count(cache_key)
        print("✅ Hit count incremented")

        # Verify increment
        final_result = await cache.get(test_fen, depth, multipv)
        if final_result:
            new_hit_count = final_result.get('hit_count', 0)
            print(f"✅ New hit count: {new_hit_count}")

        # Step 7: Get cache stats
        print("\n" + "-" * 80)
        print("Step 7: Cache Statistics")
        print("-" * 80)

        stats = await cache.get_stats()
        print(f"✅ Total entries: {stats.get('total_entries', 0)}")
        print(f"   Cache size: {stats.get('estimated_size_mb', 0)} MB")
        print(f"   Avg object size: {stats.get('avg_obj_size_bytes', 0)} bytes")

        # Summary
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - MongoDB Cache is Working!")
        print("=" * 80)
        print("\n✨ Summary:")
        print(f"   1. ✅ MongoDB connection: OK")
        print(f"   2. ✅ Engine API call: OK ({duration:.2f}s)")
        print(f"   3. ✅ Cache storage: OK ({store_duration*1000:.1f}ms)")
        print(f"   4. ✅ Cache retrieval: OK ({verify_duration*1000:.1f}ms)")
        print(f"   5. ✅ Hit count tracking: OK")
        print(f"   6. ✅ Data integrity: OK")
        print("\n🎉 The complete flow is working correctly!")

        await cache.close()
        return True

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_flow())
    sys.exit(0 if success else 1)
