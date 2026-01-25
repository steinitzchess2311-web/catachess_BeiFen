"""
Tagger Storage Operations - PGN 上传与元数据存储

遵循 Stage 03 规范：
- Bucket: catachess-pgn（由 config 控制）
- 权限：仅后端服务写入/读取
- 不覆盖 raw.pgn，重算时写新的 upload_id
"""
import json
import uuid
import hashlib
from datetime import datetime
from typing import TypedDict

from storage.core.client import StorageClient
from storage.tagger.keys import TaggerKeyBuilder


class TaggerMeta(TypedDict):
    """元数据结构（来自 Stage 03）"""
    checksum: str
    original_filename: str
    upload_user_id: str
    uploaded_at: str
    parser_version: str


class TaggerStorage:
    """
    Tagger 存储操作封装。

    职责：
    - 上传 PGN 原文到 R2
    - 上传/读取元数据 JSON
    - 检查文件是否存在
    """

    PARSER_VERSION = "1.0.0"

    def __init__(self, client: StorageClient):
        """
        初始化 tagger 存储。

        Args:
            client: StorageClient 实例
        """
        self._client = client
        self._keys = TaggerKeyBuilder

    def upload_pgn(
        self,
        player_id: uuid.UUID,
        upload_id: uuid.UUID,
        pgn_content: bytes,
        original_filename: str,
        upload_user_id: uuid.UUID,
    ) -> tuple[str, str]:
        """
        上传 PGN 文件及其元数据。

        Args:
            player_id: 棋手 ID
            upload_id: 上传记录 ID
            pgn_content: PGN 文件内容
            original_filename: 原始文件名
            upload_user_id: 上传用户 ID

        Returns:
            (raw_key, meta_key) 元组
        """
        raw_key = self._keys.raw_pgn(player_id, upload_id)
        meta_key = self._keys.meta_json(player_id, upload_id)

        # 计算 checksum
        checksum = hashlib.sha256(pgn_content).hexdigest()

        # 构建元数据
        meta: TaggerMeta = {
            "checksum": checksum,
            "original_filename": original_filename,
            "upload_user_id": str(upload_user_id),
            "uploaded_at": datetime.utcnow().isoformat(),
            "parser_version": self.PARSER_VERSION,
        }

        # 上传 PGN
        self._client.put_object(
            key=raw_key,
            content=pgn_content,
            content_type="application/x-chess-pgn",
        )

        # 上传元数据
        self._client.put_object(
            key=meta_key,
            content=json.dumps(meta).encode("utf-8"),
            content_type="application/json",
        )

        return raw_key, meta_key

    def get_pgn(self, player_id: uuid.UUID, upload_id: uuid.UUID) -> bytes:
        """
        获取 PGN 文件内容。

        Args:
            player_id: 棋手 ID
            upload_id: 上传记录 ID

        Returns:
            PGN 文件内容
        """
        key = self._keys.raw_pgn(player_id, upload_id)
        return self._client.get_object(key)

    def get_meta(self, player_id: uuid.UUID, upload_id: uuid.UUID) -> TaggerMeta:
        """
        获取元数据。

        Args:
            player_id: 棋手 ID
            upload_id: 上传记录 ID

        Returns:
            元数据字典
        """
        key = self._keys.meta_json(player_id, upload_id)
        content = self._client.get_object(key)
        return json.loads(content.decode("utf-8"))

    def exists(self, player_id: uuid.UUID, upload_id: uuid.UUID) -> bool:
        """
        检查上传是否存在。

        Args:
            player_id: 棋手 ID
            upload_id: 上传记录 ID

        Returns:
            True 如果 raw.pgn 存在
        """
        key = self._keys.raw_pgn(player_id, upload_id)
        return self._client.exists(key)

    @staticmethod
    def compute_checksum(content: bytes) -> str:
        """计算内容的 SHA256 校验和。"""
        return hashlib.sha256(content).hexdigest()
