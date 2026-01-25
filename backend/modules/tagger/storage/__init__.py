"""
Tagger storage package.
"""
from modules.tagger.storage.r2_client import TaggerStorage, TaggerStorageConfig, TaggerKeyBuilder

__all__ = [
    "TaggerStorage",
    "TaggerStorageConfig",
    "TaggerKeyBuilder",
]
