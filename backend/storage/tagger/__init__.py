"""
Tagger Storage Module - PGN 文件存储

Key 规范：
- PGN 原文：players/{player_id}/{upload_id}/raw.pgn
- 元数据：players/{player_id}/{upload_id}/meta.json
"""
from storage.tagger.keys import TaggerKeyBuilder
from storage.tagger.operations import TaggerStorage

__all__ = ["TaggerKeyBuilder", "TaggerStorage"]
