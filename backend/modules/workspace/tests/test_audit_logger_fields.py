"""Audit logger subscriber field tests."""
from types import SimpleNamespace

import pytest
from sqlalchemy import select

from modules.workspace.db.repos.audit_log_repo import AuditLogRepository
from modules.workspace.db.tables.audit_log import AuditLog
from modules.workspace.events.subscribers.audit_logger import AuditLogger
from modules.workspace.events.types import EventType


def _event(target_id: str, target_type: str):
    return SimpleNamespace(
        type=EventType.DISCUSSION_THREAD_DELETED,
        actor_id="u9",
        target_id=target_id,
        target_type=target_type,
        payload={"note": "x"},
    )


@pytest.mark.asyncio
async def test_logs_target_fields(session):
    logger = AuditLogger(AuditLogRepository(session))
    await logger.handle_event(_event("thread-1", "discussion_thread"))
    row = (await session.execute(select(AuditLog))).scalars().one()
    assert (row.target_id, row.target_type) == ("thread-1", "discussion_thread")


@pytest.mark.asyncio
async def test_logs_multiple_events(session):
    logger = AuditLogger(AuditLogRepository(session))
    await logger.handle_event(_event("thread-1", "discussion_thread"))
    await logger.handle_event(_event("thread-2", "discussion_thread"))
    rows = (await session.execute(select(AuditLog))).scalars().all()
    assert len(rows) == 2
