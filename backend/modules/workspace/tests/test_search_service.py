"""
Unit tests for SearchService.
"""

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from workspace.db.repos.acl_repo import ACLRepository
from workspace.db.repos.node_repo import NodeRepository
from workspace.db.repos.search_index_repo import SearchIndexRepository
from workspace.db.tables.acls import ACL
from workspace.db.tables.nodes import Node
from workspace.db.tables.search_index import SearchIndex
from workspace.domain.services.search_service import SearchService


@pytest.fixture
async def node_repo(session: AsyncSession) -> NodeRepository:
    """Get node repository."""
    return NodeRepository(session)


@pytest.fixture
async def acl_repo(session: AsyncSession) -> ACLRepository:
    """Get ACL repository."""
    return ACLRepository(session)


@pytest.fixture
async def search_repo(session: AsyncSession) -> SearchIndexRepository:
    """Get search index repository."""
    return SearchIndexRepository(session)


@pytest.fixture
async def search_service(
    search_repo: SearchIndexRepository,
    node_repo: NodeRepository,
    acl_repo: ACLRepository,
) -> SearchService:
    """Get search service."""
    return SearchService(search_repo, node_repo, acl_repo)


@pytest.fixture
async def user_id() -> str:
    """Test user ID."""
    return str(uuid.uuid4())


@pytest.fixture
async def other_user_id() -> str:
    """Another test user ID."""
    return str(uuid.uuid4())


@pytest.fixture
async def test_node(
    node_repo: NodeRepository, user_id: str, session: AsyncSession
) -> Node:
    """Create a test node."""
    node = Node(
        id=str(uuid.uuid4()),
        title="Test Node",
        node_type="study",
        owner_id=user_id,
        version=1,
    )
    node = await node_repo.create(node)
    await session.commit()
    return node


@pytest.fixture
async def test_acl(
    acl_repo: ACLRepository, test_node: Node, user_id: str, session: AsyncSession
) -> ACL:
    """Create a test ACL."""
    acl = ACL(
        id=str(uuid.uuid4()),
        node_id=test_node.id,
        user_id=user_id,
        role="owner",
    )
    acl = await acl_repo.create(acl)
    await session.commit()
    return acl


@pytest.mark.asyncio
async def test_search_empty_query_returns_no_results(
    search_service: SearchService, user_id: str
) -> None:
    """Test that empty query handling works."""
    # Empty database, should return no results
    results = await search_service.search("test query", user_id)
    assert results.results == []
    assert results.total == 0
    assert results.has_more is False


@pytest.mark.asyncio
async def test_search_filters_by_permissions(
    search_service: SearchService,
    search_repo: SearchIndexRepository,
    test_node: Node,
    test_acl: ACL,
    user_id: str,
    other_user_id: str,
    session: AsyncSession,
) -> None:
    """Test that search results are filtered by user permissions."""
    # Create search index entry for test node
    await search_repo.upsert(
        entry_id=str(uuid.uuid4()),
        target_id=test_node.id,
        target_type="study",
        content="Test searchable content",
        author_id=user_id,
    )
    await session.commit()

    # Owner should see the result
    results = await search_service.search("searchable", user_id)
    assert len(results.results) == 1
    assert results.results[0].target_id == test_node.id

    # Other user without permissions should not see it
    results = await search_service.search("searchable", other_user_id)
    assert len(results.results) == 0


@pytest.mark.asyncio
async def test_search_metadata_finds_nodes_by_title(
    search_service: SearchService,
    test_node: Node,
    test_acl: ACL,
    user_id: str,
    session: AsyncSession,
) -> None:
    """Test that metadata search finds nodes by title."""
    results = await search_service.search_metadata("Test Node", user_id)
    assert len(results.results) == 1
    assert results.results[0].target_id == test_node.id
    assert results.results[0].content == "Test Node"


@pytest.mark.asyncio
async def test_search_metadata_case_insensitive(
    search_service: SearchService,
    test_node: Node,
    test_acl: ACL,
    user_id: str,
) -> None:
    """Test that metadata search is case-insensitive."""
    results = await search_service.search_metadata("test node", user_id)
    assert len(results.results) == 1

    results = await search_service.search_metadata("TEST NODE", user_id)
    assert len(results.results) == 1


@pytest.mark.asyncio
async def test_search_metadata_partial_match(
    search_service: SearchService,
    test_node: Node,
    test_acl: ACL,
    user_id: str,
) -> None:
    """Test that metadata search supports partial matches."""
    results = await search_service.search_metadata("Test", user_id)
    assert len(results.results) == 1

    results = await search_service.search_metadata("Node", user_id)
    assert len(results.results) == 1


@pytest.mark.asyncio
async def test_search_metadata_filters_by_node_type(
    search_service: SearchService,
    node_repo: NodeRepository,
    acl_repo: ACLRepository,
    user_id: str,
    session: AsyncSession,
) -> None:
    """Test that metadata search can filter by node type."""
    # Create study node
    study = Node(
        id=str(uuid.uuid4()),
        title="Study Title",
        node_type="study",
        owner_id=user_id,
        version=1,
    )
    study = await node_repo.create(study)

    # Create workspace node
    workspace = Node(
        id=str(uuid.uuid4()),
        title="Workspace Title",
        node_type="workspace",
        owner_id=user_id,
        version=1,
    )
    workspace = await node_repo.create(workspace)

    # Create ACLs
    await acl_repo.create(
        ACL(id=str(uuid.uuid4()), node_id=study.id, user_id=user_id, role="owner")
    )
    await acl_repo.create(
        ACL(
            id=str(uuid.uuid4()), node_id=workspace.id, user_id=user_id, role="owner"
        )
    )
    await session.commit()

    # Search for all nodes
    results = await search_service.search_metadata("Title", user_id)
    assert len(results.results) == 2

    # Filter by study
    results = await search_service.search_metadata("Title", user_id, node_type="study")
    assert len(results.results) == 1
    assert results.results[0].target_type == "study"

    # Filter by workspace
    results = await search_service.search_metadata(
        "Title", user_id, node_type="workspace"
    )
    assert len(results.results) == 1
    assert results.results[0].target_type == "workspace"


@pytest.mark.asyncio
async def test_search_pagination(
    search_service: SearchService,
    search_repo: SearchIndexRepository,
    test_node: Node,
    user_id: str,
    session: AsyncSession,
) -> None:
    """Test search pagination."""
    # Create multiple search entries
    for i in range(5):
        await search_repo.upsert(
            entry_id=str(uuid.uuid4()),
            target_id=f"target-{i}",
            target_type="discussion_thread",
            content=f"Searchable content {i}",
            author_id=user_id,
        )
    await session.commit()

    # First page with page_size=2
    results = await search_service.search("content", user_id, page=1, page_size=2)
    assert len(results.results) <= 2
    assert results.page == 1
    assert results.page_size == 2

    # Second page
    results = await search_service.search("content", user_id, page=2, page_size=2)
    assert results.page == 2


@pytest.mark.asyncio
async def test_extract_highlight_with_match(
    search_service: SearchService,
) -> None:
    """Test highlight extraction with matching query."""
    content = "This is a long piece of content that contains the word searchable in the middle of it."
    highlight = search_service._extract_highlight(content, "searchable", context_size=20)

    assert "searchable" in highlight
    assert "..." in highlight  # Should have ellipsis


@pytest.mark.asyncio
async def test_extract_highlight_without_match(
    search_service: SearchService,
) -> None:
    """Test highlight extraction without matching query."""
    content = "This is some content"
    highlight = search_service._extract_highlight(content, "missing", context_size=20)

    # Should return beginning of content
    assert "This is some content" in highlight


@pytest.mark.asyncio
async def test_search_content_alias(
    search_service: SearchService,
    search_repo: SearchIndexRepository,
    user_id: str,
    session: AsyncSession,
) -> None:
    """Test that search_content is an alias for search."""
    # Create search entry
    await search_repo.upsert(
        entry_id=str(uuid.uuid4()),
        target_id="thread-1",
        target_type="discussion_thread",
        content="Thread content",
        author_id=user_id,
    )
    await session.commit()

    # Both methods should return the same results
    results1 = await search_service.search("content", user_id)
    results2 = await search_service.search_content("content", user_id)

    assert len(results1.results) == len(results2.results)
    if results1.results:
        assert results1.results[0].target_id == results2.results[0].target_id


@pytest.mark.asyncio
async def test_search_respects_limit(
    search_service: SearchService,
    search_repo: SearchIndexRepository,
    user_id: str,
    session: AsyncSession,
) -> None:
    """Test that search respects page_size limit."""
    # Create many search entries
    for i in range(50):
        await search_repo.upsert(
            entry_id=str(uuid.uuid4()),
            target_id=f"item-{i}",
            target_type="study",
            content=f"Content {i}",
            author_id=user_id,
        )
    await session.commit()

    # Request only 10 results
    results = await search_service.search("Content", user_id, page_size=10)
    assert len(results.results) <= 10
