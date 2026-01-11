"""Activity logger subscriber basic tests."""
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from workspace.db.repos.activity_log_repo import ActivityLogRepository
from workspace.db.tables.activity_log import ActivityLog
from workspace.events.subscribers.activity_logger import ActivityLogger
from workspace.events.types import EventType


def _event(event_type: str, payload: dict | None = None):
    return SimpleNamespace(
        type=event_type,
        actor_id="u1",
        target_id="t1",
        target_type="discussion_thread",
        payload=payload or {},
    )


@pytest.mark.asyncio
async def test_logs_discussion_event(session):
    logger = ActivityLogger(ActivityLogRepository(session))
    await logger.handle_event(_event(EventType.DISCUSSION_THREAD_CREATED))
    rows = (await session.execute(select(ActivityLog))).scalars().all()
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_ignores_non_discussion_event(session):
    logger = ActivityLogger(ActivityLogRepository(session))
    await logger.handle_event(_event(EventType.STUDY_CREATED))
    rows = (await session.execute(select(ActivityLog))).scalars().all()
    assert rows == []


@pytest.mark.asyncio
async def test_logs_payload_details(session):
    logger = ActivityLogger(ActivityLogRepository(session))
    await logger.handle_event(
        _event(EventType.DISCUSSION_THREAD_UPDATED, {"changed": "title"})
    )
    row = (await session.execute(select(ActivityLog))).scalars().one()
    assert row.details == {"changed": "title"}
