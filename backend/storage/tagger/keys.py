"""
Tagger Key Builder - R2 对象 Key 生成

Key 规范（来自 Stage 03）：
- PGN 原文：players/{player_id}/{upload_id}/raw.pgn
- 元数据：players/{player_id}/{upload_id}/meta.json

重算规则：不覆盖 raw.pgn，重算时写新的 upload_id 目录
"""
import uuid


class TaggerKeyBuilder:
    """
    生成 tagger 模块的 R2 对象 key。

    遵循 Stage 03 规范：
    - 所有 key 以 players/ 开头
    - 按 player_id/upload_id 组织
    """

    PREFIX = "players"

    @classmethod
    def raw_pgn(cls, player_id: uuid.UUID, upload_id: uuid.UUID) -> str:
        """
        生成 PGN 原文的 key。

        Args:
            player_id: 棋手 ID
            upload_id: 上传记录 ID

        Returns:
            R2 key，格式：players/{player_id}/{upload_id}/raw.pgn
        """
        return f"{cls.PREFIX}/{player_id}/{upload_id}/raw.pgn"

    @classmethod
    def meta_json(cls, player_id: uuid.UUID, upload_id: uuid.UUID) -> str:
        """
        生成元数据 JSON 的 key。

        Args:
            player_id: 棋手 ID
            upload_id: 上传记录 ID

        Returns:
            R2 key，格式：players/{player_id}/{upload_id}/meta.json
        """
        return f"{cls.PREFIX}/{player_id}/{upload_id}/meta.json"

    @classmethod
    def player_prefix(cls, player_id: uuid.UUID) -> str:
        """
        生成棋手目录前缀，用于列出该棋手的所有上传。

        Args:
            player_id: 棋手 ID

        Returns:
            前缀，格式：players/{player_id}/
        """
        return f"{cls.PREFIX}/{player_id}/"

    @classmethod
    def upload_prefix(cls, player_id: uuid.UUID, upload_id: uuid.UUID) -> str:
        """
        生成上传目录前缀，用于列出该上传的所有文件。

        Args:
            player_id: 棋手 ID
            upload_id: 上传记录 ID

        Returns:
            前缀，格式：players/{player_id}/{upload_id}/
        """
        return f"{cls.PREFIX}/{player_id}/{upload_id}/"
