"""Audit logger subscriber basic tests."""
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from workspace.db.repos.audit_log_repo import AuditLogRepository
from workspace.db.tables.audit_log import AuditLog
from workspace.events.subscribers.audit_logger import AuditLogger
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
    logger = AuditLogger(AuditLogRepository(session))
    await logger.handle_event(_event(EventType.DISCUSSION_THREAD_CREATED))
    rows = (await session.execute(select(AuditLog))).scalars().all()
    assert len(rows) == 1


@pytest.mark.asyncio
async def test_ignores_non_discussion_event(session):
    logger = AuditLogger(AuditLogRepository(session))
    await logger.handle_event(_event(EventType.STUDY_CREATED))
    rows = (await session.execute(select(AuditLog))).scalars().all()
    assert rows == []


@pytest.mark.asyncio
async def test_logs_payload_details(session):
    logger = AuditLogger(AuditLogRepository(session))
    await logger.handle_event(
        _event(EventType.DISCUSSION_REPLY_EDITED, {"diff": "changed"})
    )
    row = (await session.execute(select(AuditLog))).scalars().one()
    assert row.details == {"diff": "changed"}
