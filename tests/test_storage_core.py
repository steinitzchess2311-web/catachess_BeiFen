"""
Test Storage Core - Configuration and Errors

Tests the storage/core infrastructure layer without requiring R2 connection.
Covers:
- Configuration creation and validation
- Error class hierarchy
- Error messages and details
- Config safety (credential masking)
"""
import sys
from pathlib import Path
import os

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


def test_storage_config_from_dict():
    """Test creating config with explicit values"""
    print("=" * 60)
    print("TEST: Storage Config Creation")
    print("=" * 60)

    from storage.core.config import StorageConfig

    config = StorageConfig(
        endpoint="https://test.r2.cloudflarestorage.com",
        bucket="test-bucket",
        access_key_id="test-key-123",
        secret_access_key="test-secret-456",
        region="auto",
        account_id="test-account",
    )

    assert config.endpoint == "https://test.r2.cloudflarestorage.com"
    assert config.bucket == "test-bucket"
    assert config.access_key_id == "test-key-123"
    assert config.secret_access_key == "test-secret-456"
    assert config.region == "auto"
    assert config.account_id == "test-account"

    print("✓ Config created with all fields")
    print(f"  Endpoint: {config.endpoint}")
    print(f"  Bucket: {config.bucket}")
    print(f"  Region: {config.region}")

    print("\n✅ Config creation working\n")


def test_storage_config_for_testing():
    """Test for_testing factory method"""
    print("=" * 60)
    print("TEST: Storage Config for Testing")
    print("=" * 60)

    from storage.core.config import StorageConfig

    config = StorageConfig.for_testing()

    assert config.endpoint == "http://localhost:9000"
    assert config.bucket == "test-bucket"
    assert config.access_key_id == "test-access-key"
    assert config.secret_access_key == "test-secret-key"
    assert config.region == "auto"

    print("✓ Default test config created")
    print(f"  Endpoint: {config.endpoint}")

    # Test with custom values
    config2 = StorageConfig.for_testing(
        endpoint="http://minio:9000",
        bucket="custom-bucket",
    )

    assert config2.endpoint == "http://minio:9000"
    assert config2.bucket == "custom-bucket"

    print("✓ Custom test config created")
    print(f"  Endpoint: {config2.endpoint}")
    print(f"  Bucket: {config2.bucket}")

    print("\n✅ Test config factory working\n")


def test_storage_config_repr_safety():
    """Test that config repr doesn't expose secrets"""
    print("=" * 60)
    print("TEST: Config Repr Safety")
    print("=" * 60)

    from storage.core.config import StorageConfig

    config = StorageConfig(
        endpoint="https://test.r2.cloudflarestorage.com",
        bucket="test-bucket",
        access_key_id="VERY_SECRET_KEY_123",
        secret_access_key="SUPER_SECRET_PASSWORD_456",
    )

    repr_str = repr(config)
    str_str = str(config)

    # Secrets should NOT appear in repr
    assert "VERY_SECRET_KEY_123" not in repr_str
    assert "SUPER_SECRET_PASSWORD_456" not in repr_str
    assert "VERY_SECRET_KEY_123" not in str_str
    assert "SUPER_SECRET_PASSWORD_456" not in str_str

    # Asterisks should appear instead
    assert "*" in repr_str

    # Non-secret fields should still appear
    assert "test-bucket" in repr_str
    assert "test.r2.cloudflarestorage.com" in repr_str

    print("✓ Secrets masked in repr:")
    print(f"  {repr_str[:100]}...")
    print("✓ Secrets not exposed")
    print("✓ Non-secret fields visible")

    print("\n✅ Config repr is safe\n")


def test_storage_config_immutable():
    """Test that config is immutable (frozen)"""
    print("=" * 60)
    print("TEST: Config Immutability")
    print("=" * 60)

    from storage.core.config import StorageConfig

    config = StorageConfig.for_testing()

    # Try to modify (should fail)
    try:
        config.bucket = "hacked-bucket"
        assert False, "Config should be immutable!"
    except (AttributeError, TypeError):
        print("✓ Cannot modify bucket (frozen)")

    try:
        config.endpoint = "http://evil.com"
        assert False, "Config should be immutable!"
    except (AttributeError, TypeError):
        print("✓ Cannot modify endpoint (frozen)")

    print("\n✅ Config is properly immutable\n")


def test_storage_errors_hierarchy():
    """Test exception hierarchy and inheritance"""
    print("=" * 60)
    print("TEST: Storage Error Hierarchy")
    print("=" * 60)

    from storage.core.errors import (
        StorageError,
        StorageUnavailable,
        ObjectNotFound,
        ObjectAlreadyExists,
        InvalidObjectKey,
        StoragePermissionDenied,
    )

    # Test inheritance
    assert issubclass(StorageUnavailable, StorageError)
    assert issubclass(ObjectNotFound, StorageError)
    assert issubclass(ObjectAlreadyExists, StorageError)
    assert issubclass(InvalidObjectKey, StorageError)
    assert issubclass(StoragePermissionDenied, StorageError)

    print("✓ All errors inherit from StorageError")

    # Test that they're also Exceptions
    assert issubclass(StorageError, Exception)

    print("✓ StorageError inherits from Exception")

    print("\n✅ Error hierarchy correct\n")


def test_storage_error_object_not_found():
    """Test ObjectNotFound error"""
    print("=" * 60)
    print("TEST: ObjectNotFound Error")
    print("=" * 60)

    from storage.core.errors import ObjectNotFound, StorageError

    error = ObjectNotFound("games/abc123.pgn")

    # Test message
    assert "abc123.pgn" in error.message
    assert "not found" in error.message.lower()

    # Test details
    assert error.details["key"] == "games/abc123.pgn"

    # Test catching as StorageError
    try:
        raise error
    except StorageError as e:
        assert isinstance(e, ObjectNotFound)
        print(f"✓ Error message: {e.message}")
        print(f"✓ Error details: {e.details}")

    print("\n✅ ObjectNotFound working correctly\n")


def test_storage_error_invalid_key():
    """Test InvalidObjectKey error"""
    print("=" * 60)
    print("TEST: InvalidObjectKey Error")
    print("=" * 60)

    from storage.core.errors import InvalidObjectKey

    error = InvalidObjectKey("", "Key cannot be empty")

    assert "empty" in error.message.lower()
    assert error.details["key"] == ""
    assert error.details["reason"] == "Key cannot be empty"

    print(f"✓ Error message: {error.message}")
    print(f"✓ Error details: {error.details}")

    # Test with another reason
    error2 = InvalidObjectKey("/invalid/key", "Key cannot start with /")

    assert "/invalid/key" in error2.message
    assert "cannot start" in error2.message.lower()

    print(f"✓ Error message: {error2.message}")

    print("\n✅ InvalidObjectKey working correctly\n")


def test_storage_error_unavailable():
    """Test StorageUnavailable error"""
    print("=" * 60)
    print("TEST: StorageUnavailable Error")
    print("=" * 60)

    from storage.core.errors import StorageUnavailable

    error = StorageUnavailable("Network timeout after 30s")

    assert "timeout" in error.message.lower()
    assert "unavailable" in error.message.lower()

    print(f"✓ Error message: {error.message}")

    # Test with details
    error2 = StorageUnavailable(
        "Endpoint unreachable",
        details={"endpoint": "https://test.r2.cloudflarestorage.com", "attempts": 3}
    )

    assert error2.details["endpoint"] == "https://test.r2.cloudflarestorage.com"
    assert error2.details["attempts"] == 3

    print(f"✓ Error with details: {error2.details}")

    print("\n✅ StorageUnavailable working correctly\n")


def test_storage_error_permission_denied():
    """Test StoragePermissionDenied error"""
    print("=" * 60)
    print("TEST: StoragePermissionDenied Error")
    print("=" * 60)

    from storage.core.errors import StoragePermissionDenied

    error = StoragePermissionDenied("put_object", "Invalid credentials")

    assert "put_object" in error.message
    assert "permission denied" in error.message.lower()
    assert "credentials" in error.message.lower()

    assert error.details["operation"] == "put_object"
    assert error.details["reason"] == "Invalid credentials"

    print(f"✓ Error message: {error.message}")
    print(f"✓ Operation: {error.details['operation']}")
    print(f"✓ Reason: {error.details['reason']}")

    print("\n✅ StoragePermissionDenied working correctly\n")


def test_storage_error_message_and_details():
    """Test error message and details attributes"""
    print("=" * 60)
    print("TEST: Error Message and Details")
    print("=" * 60)

    from storage.core.errors import StorageError

    # Create base error
    error = StorageError(
        message="Something went wrong",
        details={"operation": "test", "value": 42}
    )

    assert error.message == "Something went wrong"
    assert error.details["operation"] == "test"
    assert error.details["value"] == 42

    print("✓ Error has message attribute")
    print("✓ Error has details dict")

    # Test error without details
    error2 = StorageError("Simple error")

    assert error2.message == "Simple error"
    assert error2.details == {}

    print("✓ Error works without details")

    print("\n✅ Error attributes working correctly\n")


if __name__ == "__main__":
    print("\n" + "⚙️ " * 20)
    print("STORAGE CORE TESTS")
    print("⚙️ " * 20 + "\n")

    # Run all tests
    test_storage_config_from_dict()
    test_storage_config_for_testing()
    test_storage_config_repr_safety()
    test_storage_config_immutable()
    test_storage_errors_hierarchy()
    test_storage_error_object_not_found()
    test_storage_error_invalid_key()
    test_storage_error_unavailable()
    test_storage_error_permission_denied()
    test_storage_error_message_and_details()

    print("\n" + "🎉 " * 20)
    print("ALL STORAGE CORE TESTS COMPLETE")
    print("🎉 " * 20 + "\n")

    print("Summary:")
    print("  ✓ Config creation and validation")
    print("  ✓ Config test factory methods")
    print("  ✓ Config credential masking")
    print("  ✓ Config immutability")
    print("  ✓ Error hierarchy")
    print("  ✓ All error types working")
    print("  ✓ Error messages and details")
    print("\n✅ Storage core is production-ready!")
