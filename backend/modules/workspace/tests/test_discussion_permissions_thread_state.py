"""
Discussion thread state permission tests.
"""

import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from workspace.api.router import api_router
from workspace.db.session import get_db_config, init_db
from workspace.domain.models.types import Permission
from workspace.tests.helpers.discussion_setup import create_study_node, grant_acl


@pytest.fixture
def app() -> FastAPI:
    app = FastAPI()
    app.include_router(api_router)
    return app


async def seed_acl(permission: Permission) -> None:
    config = get_db_config()
    async with config.async_session_maker() as session:
        await create_study_node(session, "study-9", "owner-1")
        await grant_acl(session, "study-9", "user-2", permission, "owner-1")
        await session.commit()


@pytest.mark.asyncio
async def test_resolve_requires_editor(app: FastAPI):
    init_db("sqlite+aiosqlite:///:memory:", echo=False)
    await seed_acl(Permission.VIEWER)
    owner_headers = {"Authorization": "Bearer owner-1"}
    other_headers = {"Authorization": "Bearer user-2"}
    async with AsyncClient(app=app, base_url="http://test") as client:
        thread_resp = await client.post(
            "/discussions",
            json={
                "target_id": "study-9",
                "target_type": "study",
                "title": "Thread",
                "content": "Root",
                "thread_type": "note",
            },
            headers=owner_headers,
        )
        thread_id = thread_resp.json()["id"]
        response = await client.patch(
            f"/discussions/{thread_id}/resolve",
            json={"resolved": True, "version": 1},
            headers=other_headers,
        )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_pin_allows_editor(app: FastAPI):
    init_db("sqlite+aiosqlite:///:memory:", echo=False)
    await seed_acl(Permission.EDITOR)
    owner_headers = {"Authorization": "Bearer owner-1"}
    editor_headers = {"Authorization": "Bearer user-2"}
    async with AsyncClient(app=app, base_url="http://test") as client:
        thread_resp = await client.post(
            "/discussions",
            json={
                "target_id": "study-9",
                "target_type": "study",
                "title": "Thread",
                "content": "Root",
                "thread_type": "note",
            },
            headers=owner_headers,
        )
        thread_id = thread_resp.json()["id"]
        response = await client.patch(
            f"/discussions/{thread_id}/pin",
            json={"pinned": True, "version": 1},
            headers=editor_headers,
        )
    assert response.status_code == 200
