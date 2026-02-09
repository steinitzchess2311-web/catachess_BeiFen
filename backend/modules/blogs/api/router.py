"""
Blog API Router

Endpoints:
- GET /api/blogs/categories - Get all categories
- GET /api/blogs/articles - Get article list with pagination
- GET /api/blogs/articles/pinned - Get pinned articles
- GET /api/blogs/articles/:id - Get article detail
- POST /api/blogs/articles - Create article (admin/editor only)
- PUT /api/blogs/articles/:id - Update article (admin/editor only)
- DELETE /api/blogs/articles/:id - Delete article (admin only)
"""
import os
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import create_engine, select, func, and_, or_, text
from sqlalchemy.orm import Session

from modules.blogs.db.models import BlogArticle, BlogCategory
from modules.blogs.schemas import CategoryResponse, ArticleListResponse, ArticleResponse, ArticleListItem
from modules.blogs.services.cache_service import get_blog_cache, BlogCacheService

router = APIRouter(prefix="/api/blogs", tags=["Blogs"])


# ==================== Database Dependency ====================

def get_blog_db():
    """Get blog database session"""
    db_url = os.getenv("BLOG_DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=500, detail="BLOG_DATABASE_URL not configured")

    engine = create_engine(db_url)
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()


# ==================== Categories ====================

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    cache: BlogCacheService = Depends(get_blog_cache),
    db: Session = Depends(get_blog_db)
):
    """
    Get all active categories (cached for 1 hour)

    **Public endpoint** - No authentication required
    """
    # Try cache first
    cached = await cache.get_categories()
    if cached:
        return [CategoryResponse(**item) for item in cached]

    # Query database
    stmt = (
        select(BlogCategory)
        .where(BlogCategory.is_active == True)
        .order_by(BlogCategory.order_index)
    )
    categories = db.execute(stmt).scalars().all()

    # Convert to dict for caching
    result = [
        {
            "id": str(cat.id),
            "name": cat.name,
            "display_name": cat.display_name,
            "description": cat.description,
            "icon": cat.icon,
            "order_index": cat.order_index,
            "is_active": cat.is_active,
            "created_at": cat.created_at.isoformat(),
        }
        for cat in categories
    ]

    # Cache for 1 hour
    await cache.set_categories(result)

    return [CategoryResponse(**item) for item in result]


# ==================== Article List ====================

@router.get("/articles", response_model=ArticleListResponse)
async def get_articles(
    category: Optional[str] = Query(None, description="Filter by category (about/function/allblogs/user)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=50, description="Items per page"),
    search: Optional[str] = Query(None, description="Search in title/content"),
    cache: BlogCacheService = Depends(get_blog_cache),
    db: Session = Depends(get_blog_db)
):
    """
    Get article list with pagination (cached for 5 minutes)

    **Public endpoint** - No authentication required

    **Filters:**
    - category: Filter by category name
    - search: Full-text search in title and content

    **Returns:**
    - Pinned articles appear first
    - Then sorted by published_at DESC
    """
    # Try cache first (only for non-search queries)
    cache_key = category or "all"
    if not search:
        cached = await cache.get_article_list(cache_key, page)
        if cached:
            return ArticleListResponse(**cached)

    # Build query
    stmt = select(BlogArticle).where(BlogArticle.status == "published")

    # Filter by category
    if category and category != "allblogs":
        stmt = stmt.where(BlogArticle.category == category)

    # Search
    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                BlogArticle.title.ilike(search_pattern),
                BlogArticle.content.ilike(search_pattern)
            )
        )

    # Order by pinned first, then by published date
    stmt = stmt.order_by(
        BlogArticle.is_pinned.desc(),
        BlogArticle.pin_order.desc(),
        BlogArticle.published_at.desc()
    )

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar()

    # Paginate
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)

    articles = db.execute(stmt).scalars().all()

    # Build response
    items = [
        ArticleListItem(
            id=article.id,
            title=article.title,
            subtitle=article.subtitle,
            cover_image_url=article.cover_image_url,
            author_name=article.author_name,
            author_type=article.author_type,
            category=article.category,
            tags=article.tags,
            is_pinned=article.is_pinned,
            view_count=article.view_count,
            like_count=article.like_count,
            comment_count=article.comment_count,
            created_at=article.created_at,
            published_at=article.published_at,
        )
        for article in articles
    ]

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    result = {
        "items": [item.model_dump() for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }

    # Cache result (only for non-search queries)
    if not search:
        await cache.set_article_list(cache_key, page, result)

    return ArticleListResponse(**result)


# ==================== Pinned Articles ====================

@router.get("/articles/pinned", response_model=List[ArticleListItem])
async def get_pinned_articles(
    cache: BlogCacheService = Depends(get_blog_cache),
    db: Session = Depends(get_blog_db)
):
    """
    Get all pinned articles (cached for 5 minutes)

    **Public endpoint** - No authentication required
    """
    # Try cache first
    cached = await cache.get_pinned_articles()
    if cached:
        return [ArticleListItem(**item) for item in cached]

    # Query database
    stmt = (
        select(BlogArticle)
        .where(and_(
            BlogArticle.status == "published",
            BlogArticle.is_pinned == True
        ))
        .order_by(BlogArticle.pin_order.desc(), BlogArticle.published_at.desc())
    )

    articles = db.execute(stmt).scalars().all()

    # Convert to list
    result = [
        {
            "id": str(article.id),
            "title": article.title,
            "subtitle": article.subtitle,
            "cover_image_url": article.cover_image_url,
            "author_name": article.author_name,
            "author_type": article.author_type,
            "category": article.category,
            "tags": article.tags,
            "is_pinned": article.is_pinned,
            "view_count": article.view_count,
            "like_count": article.like_count,
            "comment_count": article.comment_count,
            "created_at": article.created_at.isoformat(),
            "published_at": article.published_at.isoformat() if article.published_at else None,
        }
        for article in articles
    ]

    # Cache for 5 minutes
    await cache.set_pinned_articles(result)

    return [ArticleListItem(**item) for item in result]


# ==================== Article Detail ====================

@router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(
    article_id: UUID,
    cache: BlogCacheService = Depends(get_blog_cache),
    db: Session = Depends(get_blog_db)
):
    """
    Get article detail by ID (cached for 10 minutes)

    **Public endpoint** - No authentication required

    **Side effect:** Increments view count
    """
    # Try cache first
    cached = await cache.get_article(str(article_id))
    if cached:
        # Increment view count in background
        await cache.increment_view(str(article_id))
        return ArticleResponse(**cached)

    # Query database
    stmt = select(BlogArticle).where(BlogArticle.id == article_id)
    article = db.execute(stmt).scalar_one_or_none()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if article.status != "published":
        raise HTTPException(status_code=404, detail="Article not published")

    # Convert to dict
    result = {
        "id": str(article.id),
        "title": article.title,
        "subtitle": article.subtitle,
        "content": article.content,
        "cover_image_url": article.cover_image_url,
        "author_id": str(article.author_id) if article.author_id else None,
        "author_name": article.author_name,
        "author_type": article.author_type,
        "category": article.category,
        "sub_category": article.sub_category,
        "tags": article.tags,
        "status": article.status,
        "is_pinned": article.is_pinned,
        "pin_order": article.pin_order,
        "view_count": article.view_count,
        "like_count": article.like_count,
        "comment_count": article.comment_count,
        "created_at": article.created_at.isoformat(),
        "updated_at": article.updated_at.isoformat(),
        "published_at": article.published_at.isoformat() if article.published_at else None,
    }

    # Cache for 10 minutes
    await cache.set_article(str(article_id), result)

    # Increment view count
    await cache.increment_view(str(article_id))

    return ArticleResponse(**result)


# ==================== Cache Stats (Debug) ====================

@router.get("/cache/stats")
async def get_cache_stats(cache: BlogCacheService = Depends(get_blog_cache)):
    """Get cache statistics (for monitoring)"""
    return await cache.get_cache_stats()
