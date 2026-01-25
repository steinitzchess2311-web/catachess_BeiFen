"""
Tagger Error Codes

error_code 枚举（来自 Stage 05）：
- INVALID_PGN
- HEADER_MISSING
- MATCH_AMBIGUOUS
- ENGINE_TIMEOUT
- ENGINE_503
- ILLEGAL_MOVE
- UNKNOWN_ERROR
"""
from enum import Enum


class TaggerErrorCode(str, Enum):
    """Tagger 错误码枚举"""

    INVALID_PGN = "INVALID_PGN"
    HEADER_MISSING = "HEADER_MISSING"
    MATCH_AMBIGUOUS = "MATCH_AMBIGUOUS"
    ENGINE_TIMEOUT = "ENGINE_TIMEOUT"
    ENGINE_503 = "ENGINE_503"
    ILLEGAL_MOVE = "ILLEGAL_MOVE"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"

    def get_message(self) -> str:
        """获取错误码的默认消息"""
        messages = {
            self.INVALID_PGN: "PGN 格式无效",
            self.HEADER_MISSING: "缺少必要的 PGN header",
            self.MATCH_AMBIGUOUS: "棋手匹配不唯一，需要人工确认",
            self.ENGINE_TIMEOUT: "引擎分析超时",
            self.ENGINE_503: "引擎服务不可用",
            self.ILLEGAL_MOVE: "检测到非法走子",
            self.UNKNOWN_ERROR: "未知错误",
        }
        return messages.get(self, "未知错误")


class UploadStatus(str, Enum):
    """上传状态枚举（来自 Stage 02）"""

    PENDING = "pending"
    PROCESSING = "processing"
    NEEDS_CONFIRMATION = "needs_confirmation"
    DONE = "done"
    FAILED = "failed"
    COMPLETED_WITH_ERRORS = "completed_with_errors"
