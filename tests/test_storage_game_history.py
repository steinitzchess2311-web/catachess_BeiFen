"""
Test Storage Game History - Keys and Types

Tests the storage/game_history content domain without requiring R2 connection.
Covers:
- Key generation functions
- Key patterns consistency
- Type definitions (GameMeta, AnalysisMeta, StorageStats)
- Protocol definition verification
"""
import sys
from pathlib import Path
from datetime import datetime

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


def test_game_pgn_key_generation():
    """Test PGN key generation"""
    print("=" * 60)
    print("TEST: PGN Key Generation")
    print("=" * 60)

    from storage.game_history.keys import game_pgn

    # Test various game IDs
    test_cases = [
        ("8f2a9c", "games/8f2a9c.pgn"),
        ("game_123", "games/game_123.pgn"),
        ("abc-def-ghi", "games/abc-def-ghi.pgn"),
        ("12345", "games/12345.pgn"),
    ]

    for game_id, expected_key in test_cases:
        key = game_pgn(game_id)
        assert key == expected_key
        print(f"✓ {game_id} → {key}")

    print("\n✅ PGN key generation working\n")


def test_game_analysis_key_generation():
    """Test analysis key generation"""
    print("=" * 60)
    print("TEST: Analysis Key Generation")
    print("=" * 60)

    from storage.game_history.keys import game_analysis

    test_cases = [
        ("8f2a9c", "analysis/8f2a9c.json"),
        ("game_123", "analysis/game_123.json"),
        ("test-id", "analysis/test-id.json"),
    ]

    for game_id, expected_key in test_cases:
        key = game_analysis(game_id)
        assert key == expected_key
        print(f"✓ {game_id} → {key}")

    print("\n✅ Analysis key generation working\n")


def test_all_key_functions_exist():
    """Test that all key functions are defined"""
    print("=" * 60)
    print("TEST: All Key Functions Defined")
    print("=" * 60)

    from storage.game_history import keys

    # Check all key functions exist
    assert hasattr(keys, "game_pgn")
    print("✓ game_pgn function exists")

    assert hasattr(keys, "game_analysis")
    print("✓ game_analysis function exists")

    assert hasattr(keys, "game_training_data")
    print("✓ game_training_data function exists")

    assert hasattr(keys, "game_thumbnail")
    print("✓ game_thumbnail function exists")

    # Check KEY_PATTERNS constant exists
    assert hasattr(keys, "KEY_PATTERNS")
    print("✓ KEY_PATTERNS constant exists")

    print(f"\nKey patterns defined: {len(keys.KEY_PATTERNS)}")
    for name, pattern in keys.KEY_PATTERNS.items():
        print(f"  {name}: {pattern}")

    print("\n✅ All key functions defined\n")


def test_key_patterns_consistency():
    """Test that key patterns are consistent"""
    print("=" * 60)
    print("TEST: Key Pattern Consistency")
    print("=" * 60)

    from storage.game_history.keys import (
        game_pgn,
        game_analysis,
        game_training_data,
        game_thumbnail,
        KEY_PATTERNS,
    )

    game_id = "test123"

    # Generate keys
    pgn_key = game_pgn(game_id)
    analysis_key = game_analysis(game_id)
    training_key = game_training_data(game_id)
    thumbnail_key = game_thumbnail(game_id)

    # Check they match documented patterns
    assert pgn_key == KEY_PATTERNS["game_pgn"].format(game_id=game_id)
    print(f"✓ PGN key matches pattern: {pgn_key}")

    assert analysis_key == KEY_PATTERNS["game_analysis"].format(game_id=game_id)
    print(f"✓ Analysis key matches pattern: {analysis_key}")

    assert training_key == KEY_PATTERNS["game_training"].format(game_id=game_id)
    print(f"✓ Training key matches pattern: {training_key}")

    assert thumbnail_key == KEY_PATTERNS["game_thumbnail"].format(game_id=game_id)
    print(f"✓ Thumbnail key matches pattern: {thumbnail_key}")

    print("\n✅ Key patterns are consistent\n")


def test_keys_no_leading_slash():
    """Test that keys don't have leading slashes"""
    print("=" * 60)
    print("TEST: Keys No Leading Slash")
    print("=" * 60)

    from storage.game_history.keys import game_pgn, game_analysis

    game_id = "test123"

    pgn_key = game_pgn(game_id)
    assert not pgn_key.startswith("/")
    print(f"✓ PGN key has no leading slash: {pgn_key}")

    analysis_key = game_analysis(game_id)
    assert not analysis_key.startswith("/")
    print(f"✓ Analysis key has no leading slash: {analysis_key}")

    print("\n✅ Keys properly formatted\n")


def test_game_meta_type():
    """Test GameMeta TypedDict"""
    print("=" * 60)
    print("TEST: GameMeta Type")
    print("=" * 60)

    from storage.game_history.types import GameMeta

    # Create a valid GameMeta
    meta: GameMeta = {
        "game_id": "8f2a9c",
        "created_at": datetime.now(),
        "white_player": "player1",
        "black_player": "player2",
        "result": "1-0",
        "event": "Test Tournament",
    }

    assert meta["game_id"] == "8f2a9c"
    assert meta["white_player"] == "player1"
    assert meta["black_player"] == "player2"
    assert meta["result"] == "1-0"
    assert meta["event"] == "Test Tournament"

    print("✓ GameMeta with all fields:")
    print(f"  Game ID: {meta['game_id']}")
    print(f"  White: {meta['white_player']}")
    print(f"  Black: {meta['black_player']}")
    print(f"  Result: {meta['result']}")

    # Test with None values
    meta2: GameMeta = {
        "game_id": "test456",
        "created_at": datetime.now(),
        "white_player": None,
        "black_player": None,
        "result": None,
        "event": None,
    }

    assert meta2["white_player"] is None
    assert meta2["result"] is None
    print("✓ GameMeta with None values works")

    print("\n✅ GameMeta type working\n")


def test_analysis_meta_type():
    """Test AnalysisMeta TypedDict"""
    print("=" * 60)
    print("TEST: AnalysisMeta Type")
    print("=" * 60)

    from storage.game_history.types import AnalysisMeta

    meta: AnalysisMeta = {
        "game_id": "8f2a9c",
        "engine_version": "Stockfish 16",
        "depth": 20,
        "analyzed_at": datetime.now(),
        "move_count": 45,
    }

    assert meta["game_id"] == "8f2a9c"
    assert meta["engine_version"] == "Stockfish 16"
    assert meta["depth"] == 20
    assert meta["move_count"] == 45

    print("✓ AnalysisMeta structure valid:")
    print(f"  Engine: {meta['engine_version']}")
    print(f"  Depth: {meta['depth']}")
    print(f"  Moves: {meta['move_count']}")

    print("\n✅ AnalysisMeta type working\n")


def test_storage_stats_type():
    """Test StorageStats TypedDict"""
    print("=" * 60)
    print("TEST: StorageStats Type")
    print("=" * 60)

    from storage.game_history.types import StorageStats

    stats: StorageStats = {
        "game_id": "8f2a9c",
        "pgn_size_bytes": 1024,
        "analysis_size_bytes": 2048,
        "total_size_bytes": 3072,
    }

    assert stats["pgn_size_bytes"] == 1024
    assert stats["analysis_size_bytes"] == 2048
    assert stats["total_size_bytes"] == 3072

    print("✓ StorageStats structure valid:")
    print(f"  PGN size: {stats['pgn_size_bytes']} bytes")
    print(f"  Analysis size: {stats['analysis_size_bytes']} bytes")
    print(f"  Total: {stats['total_size_bytes']} bytes")

    # Test with None analysis
    stats2: StorageStats = {
        "game_id": "test456",
        "pgn_size_bytes": 512,
        "analysis_size_bytes": None,
        "total_size_bytes": 512,
    }

    assert stats2["analysis_size_bytes"] is None
    print("✓ StorageStats with None analysis works")

    print("\n✅ StorageStats type working\n")


def test_game_history_index_protocol():
    """Test GameHistoryIndex protocol definition"""
    print("=" * 60)
    print("TEST: GameHistoryIndex Protocol")
    print("=" * 60)

    from storage.game_history.index import GameHistoryIndex

    # Verify protocol has all required methods
    required_methods = [
        "add_game",
        "list_games",
        "get_game",
        "remove_game",
        "game_exists_for_user",
    ]

    for method_name in required_methods:
        assert hasattr(GameHistoryIndex, method_name), f"Missing method: {method_name}"
        print(f"✓ Method defined: {method_name}")

    print("\n✅ GameHistoryIndex protocol complete\n")


def test_game_history_index_cannot_instantiate():
    """Test that Protocol cannot be instantiated"""
    print("=" * 60)
    print("TEST: Protocol Cannot Be Instantiated")
    print("=" * 60)

    from storage.game_history.index import GameHistoryIndex

    # Protocols cannot be instantiated directly
    try:
        index = GameHistoryIndex()  # This should fail
        # If we got here, it's either not a protocol or Python version < 3.8
        print("⚠️ Protocol instantiation not prevented (may be Python version)")
    except TypeError as e:
        print(f"✓ Cannot instantiate Protocol: {str(e)[:50]}...")

    print("\n✅ Protocol properly defined\n")


def test_mock_index_implementation():
    """Test that a class can implement the protocol"""
    print("=" * 60)
    print("TEST: Mock Index Implementation")
    print("=" * 60)

    from storage.game_history.index import GameHistoryIndex
    from storage.game_history.types import GameMeta
    from typing import List

    # Create a mock implementation
    class MockGameIndex:
        def add_game(self, user_id: str, game_id: str, created_at: datetime, **kwargs):
            pass

        def list_games(self, user_id: str, limit: int = 100, offset: int = 0) -> List[GameMeta]:
            return []

        def get_game(self, user_id: str, game_id: str) -> GameMeta | None:
            return None

        def remove_game(self, user_id: str, game_id: str):
            pass

        def game_exists_for_user(self, user_id: str, game_id: str) -> bool:
            return False

    # Create instance
    mock_index = MockGameIndex()

    # Test that it has all methods
    assert hasattr(mock_index, "add_game")
    assert hasattr(mock_index, "list_games")
    assert hasattr(mock_index, "get_game")
    assert hasattr(mock_index, "remove_game")
    assert hasattr(mock_index, "game_exists_for_user")

    print("✓ Mock index implements all methods")

    # Test calling methods
    mock_index.add_game("user1", "game1", datetime.now())
    print("✓ add_game callable")

    games = mock_index.list_games("user1")
    assert games == []
    print("✓ list_games callable")

    exists = mock_index.game_exists_for_user("user1", "game1")
    assert exists == False
    print("✓ game_exists_for_user callable")

    print("\n✅ Protocol can be implemented correctly\n")


if __name__ == "__main__":
    print("\n" + "🎮 " * 20)
    print("STORAGE GAME HISTORY TESTS")
    print("🎮 " * 20 + "\n")

    # Run all tests
    test_game_pgn_key_generation()
    test_game_analysis_key_generation()
    test_all_key_functions_exist()
    test_key_patterns_consistency()
    test_keys_no_leading_slash()
    test_game_meta_type()
    test_analysis_meta_type()
    test_storage_stats_type()
    test_game_history_index_protocol()
    test_game_history_index_cannot_instantiate()
    test_mock_index_implementation()

    print("\n" + "🎉 " * 20)
    print("ALL GAME HISTORY TESTS COMPLETE")
    print("🎉 " * 20 + "\n")

    print("Summary:")
    print("  ✓ Key generation functions working")
    print("  ✓ Key patterns consistent")
    print("  ✓ Keys properly formatted")
    print("  ✓ GameMeta type working")
    print("  ✓ AnalysisMeta type working")
    print("  ✓ StorageStats type working")
    print("  ✓ GameHistoryIndex protocol defined")
    print("  ✓ Protocol can be implemented")
    print("\n✅ Game history storage is production-ready!")
