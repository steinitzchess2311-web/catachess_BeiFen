"""
Blog Database Models

Defines SQLAlchemy models for blog articles and categories.
"""
import uuid
from datetime import datetime
from typing import List

from sqlalchemy import String, Boolean, DateTime, Integer, Text, ARRAY, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.db.base import Base


class BlogArticle(Base):
    """Blog article model."""

    __tablename__ = "blog_articles"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Basic information
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True,
    )

    subtitle: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    cover_image_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Author information
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )

    author_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Chessortag Team",
    )

    author_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="official",
    )

    # Category and tags
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    sub_category: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    tags: Mapped[List[str] | None] = mapped_column(
        ARRAY(Text),
        nullable=True,
    )

    # Status control
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="draft",
        index=True,
    )

    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    pin_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # Statistics
    view_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    like_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    comment_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published', 'archived')",
            name="blog_articles_status_check"
        ),
        CheckConstraint(
            "author_type IN ('official', 'user')",
            name="blog_articles_author_type_check"
        ),
    )

    def __repr__(self) -> str:
        return f"<BlogArticle(id={self.id}, title='{self.title}', status='{self.status}')>"


class BlogCategory(Base):
    """Blog category model."""

    __tablename__ = "blog_categories"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Category information
    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    icon: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    order_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    def __repr__(self) -> str:
        return f"<BlogCategory(id={self.id}, name='{self.name}')>"


class BlogArticleImage(Base):
    """Blog article-image association table (many-to-many)."""

    __tablename__ = "blog_article_images"

    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Foreign keys
    article_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    image_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Metadata
    position: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    usage_context: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="content",
    )

    # Timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "usage_context IN ('content', 'cover')",
            name="blog_article_images_usage_check"
        ),
    )

    def __repr__(self) -> str:
        return f"<BlogArticleImage(article={self.article_id}, image={self.image_id})>"
