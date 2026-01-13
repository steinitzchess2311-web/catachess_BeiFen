"""Search endpoints for content and metadata search."""

from fastapi import APIRouter, Depends, Query

from modules.workspace.api.deps import get_current_user_id, get_search_service
from modules.workspace.api.schemas.search import (
    ContentSearchResponse,
    MetadataSearchResponse,
    SearchQuery,
    SearchResponse,
    SearchResultItem,
)
from modules.workspace.domain.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    target_type: str | None = Query(None, description="Filter by target type"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    search_type: str = Query(
        "all", description="Search type: all, metadata, content"
    ),
    user_id: str = Depends(get_current_user_id),
    service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    """
    Search for content across the workspace.

    Searches through:
    - Workspace/folder/study names (metadata)
    - Discussion threads and replies (content)
    - Annotations (content)

    Results are filtered by permissions - only returns results the user can access.

    Args:
        q: Search query string
        target_type: Optional filter by type (workspace, study, discussion_thread, etc.)
        page: Page number for pagination
        page_size: Results per page
        search_type: Type of search - "all", "metadata", or "content"
        user_id: Current user ID (from auth)
        service: Search service dependency

    Returns:
        SearchResponse with filtered results
    """
    # Route to appropriate search method based on search_type
    if search_type == "metadata":
        results = await service.search_metadata(
            query=q,
            user_id=user_id,
            node_type=target_type,
            page=page,
            page_size=page_size,
        )
    elif search_type == "content":
        results = await service.search_content(
            query=q,
            user_id=user_id,
            target_type=target_type,
            page=page,
            page_size=page_size,
        )
    else:
        # "all" - search everything
        results = await service.search(
            query=q,
            user_id=user_id,
            target_type=target_type,
            page=page,
            page_size=page_size,
        )

    # Convert to API response format
    return SearchResponse(
        results=[
            SearchResultItem(
                target_id=r.target_id,
                target_type=r.target_type,
                content=r.content,
                author_id=r.author_id,
                highlight=r.highlight,
                score=r.score,
            )
            for r in results.results
        ],
        total=results.total,
        page=results.page,
        page_size=results.page_size,
        has_more=results.has_more,
        query=q,
    )


@router.get("/metadata", response_model=MetadataSearchResponse)
async def search_metadata(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    node_type: str | None = Query(None, description="Filter by node type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    user_id: str = Depends(get_current_user_id),
    service: SearchService = Depends(get_search_service),
) -> MetadataSearchResponse:
    """
    Search workspace/folder/study metadata (names).

    Searches node names and returns only nodes the user has access to.

    Args:
        q: Search query
        node_type: Optional filter by node type (workspace, folder, study)
        page: Page number
        page_size: Results per page
        user_id: Current user ID
        service: Search service

    Returns:
        MetadataSearchResponse with matching nodes
    """
    results = await service.search_metadata(
        query=q,
        user_id=user_id,
        node_type=node_type,
        page=page,
        page_size=page_size,
    )

    return MetadataSearchResponse(
        results=[
            SearchResultItem(
                target_id=r.target_id,
                target_type=r.target_type,
                content=r.content,
                author_id=r.author_id,
                highlight=r.highlight,
                score=r.score,
            )
            for r in results.results
        ],
        total=results.total,
        page=results.page,
        page_size=results.page_size,
        has_more=results.has_more,
        query=q,
    )


@router.get("/content", response_model=ContentSearchResponse)
async def search_content(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    target_type: str | None = Query(None, description="Filter by target type"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    user_id: str = Depends(get_current_user_id),
    service: SearchService = Depends(get_search_service),
) -> ContentSearchResponse:
    """
    Search full-text indexed content (discussions, annotations).

    Searches through discussion threads, replies, and annotations.
    Results are permission-filtered.

    Args:
        q: Search query
        target_type: Optional filter by type (discussion_thread, discussion_reply, etc.)
        page: Page number
        page_size: Results per page
        user_id: Current user ID
        service: Search service

    Returns:
        ContentSearchResponse with matching content
    """
    results = await service.search_content(
        query=q,
        user_id=user_id,
        target_type=target_type,
        page=page,
        page_size=page_size,
    )

    return ContentSearchResponse(
        results=[
            SearchResultItem(
                target_id=r.target_id,
                target_type=r.target_type,
                content=r.content,
                author_id=r.author_id,
                highlight=r.highlight,
                score=r.score,
            )
            for r in results.results
        ],
        total=results.total,
        page=results.page,
        page_size=results.page_size,
        has_more=results.has_more,
        query=q,
    )
