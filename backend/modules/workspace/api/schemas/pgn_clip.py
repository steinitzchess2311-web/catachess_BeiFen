"""
PGN clip/export API schemas.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PgnClipRequest(BaseModel):
    """Schema for clipping or exporting PGN."""

    chapter_id: str = Field(..., min_length=1)
    move_path: str | None = Field(
        None, description="Move path for clip mode (e.g., main.12.var2.3)"
    )
    mode: Literal["clip", "no_comment", "raw", "clean"] = "clip"
    for_clipboard: bool = True


class PgnClipResponse(BaseModel):
    """Schema for PGN clip/export response."""

    pgn_text: str
    export_mode: str
    timestamp: datetime
    move_path: str | None = None
    moves_removed: int | None = None
    variations_removed: int | None = None


class PgnExportRequest(BaseModel):
    """Schema for exporting PGN without clipping."""

    chapter_id: str = Field(..., min_length=1)
    for_clipboard: bool = True


class PgnClipPreviewResponse(BaseModel):
    """Schema for PGN clip preview response."""

    target_move: str
    moves_before: int
    moves_after: int
    variations_removed: int
    variations_kept: int
    preview_text: str
