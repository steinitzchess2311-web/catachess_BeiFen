"""Activity logger subscriber field tests."""
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from workspace.db.repos.activity_log_repo import ActivityLogRepository
from workspace.db.tables.activity_log import ActivityLog
from workspace.events.subscribers.activity_logger import ActivityLogger
from workspace.events.types import EventType


def _event(target_id: str, target_type: str):
    return SimpleNamespace(
        type=EventType.DISCUSSION_REPLY_ADDED,
        actor_id="u9",
        target_id=target_id,
        target_type=target_type,
        payload={"note": "x"},
    )


@pytest.mark.asyncio
async def test_logs_target_fields(session):
    logger = ActivityLogger(ActivityLogRepository(session))
    await logger.handle_event(_event("reply-1", "discussion_reply"))
    row = (await session.execute(select(ActivityLog))).scalars().one()
    assert (row.target_id, row.target_type) == ("reply-1", "discussion_reply")


@pytest.mark.asyncio
async def test_logs_multiple_events(session):
    logger = ActivityLogger(ActivityLogRepository(session))
    await logger.handle_event(_event("reply-1", "discussion_reply"))
    await logger.handle_event(_event("reply-2", "discussion_reply"))
    rows = (await session.execute(select(ActivityLog))).scalars().all()
    assert len(rows) == 2
