"""
Integration test for /api/chess/apply-move metadata -> study move creation.
"""

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from ulid import ULID

from core.chess_basic.constants import STARTING_FEN
from modules.workspace.api.router import api_router
from routers import chess_rules


@pytest.fixture
def app() -> FastAPI:
    """Create FastAPI app for testing."""
    app = FastAPI()
    app.include_router(api_router)
    app.include_router(chess_rules.router)
    return app


@pytest.mark.asyncio
async def test_apply_move_metadata_creates_study_move(app: FastAPI, variation_repo, session):
    """Ensure apply-move returns metadata usable by study move creation."""
    study_id = str(ULID())
    chapter_id = str(ULID())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        apply_response = await client.post(
            "/api/chess/apply-move",
            json={
                "position": STARTING_FEN,
                "move": {
                    "from_square": {"file": 4, "rank": 1},
                    "to_square": {"file": 4, "rank": 3},
                    "promotion": None,
                },
            },
        )

        assert apply_response.status_code == 200
        apply_data = apply_response.json()
        move_meta = apply_data["move"]

        response = await client.post(
            f"/studies/{study_id}/chapters/{chapter_id}/moves",
            json={
                "san": move_meta["san"],
                "uci": move_meta["uci"],
                "fen": move_meta["fen"],
                "move_number": move_meta["move_number"],
                "color": move_meta["color"],
                "rank": 0,
            },
            headers={"Authorization": "Bearer user123"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["san"] == "e4"
    assert data["uci"] == "e2e4"
