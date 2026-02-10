"""
Blog Images Database Models
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from core.db.base import Base


class BlogImage(Base):
    """Blog image metadata table"""
    __tablename__ = "blog_images"

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # File information
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)  # Path in R2
    url: Mapped[str] = mapped_column(Text, nullable=False)  # CDN URL
    content_type: Mapped[str] = mapped_column(String(50), nullable=False)  # image/jpeg, image/png, etc.

    # Image dimensions and size
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)

    # Processing info
    resize_mode: Mapped[str] = mapped_column(String(20), nullable=False)  # "original" | "adaptive_width"
    image_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "cover" | "content"

    # Relationships
    uploaded_by: Mapped[Optional[uuid4]] = mapped_column(UUID(as_uuid=True), nullable=True)
    article_id: Mapped[Optional[uuid4]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("blog_articles.id", ondelete="SET NULL"),
        nullable=True
    )

    # Orphan tracking
    is_orphan: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    marked_for_deletion_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    last_referenced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self):
        return f"<BlogImage {self.filename} ({self.resize_mode})>"
