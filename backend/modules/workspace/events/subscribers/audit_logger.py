from ulid import ULID

from workspace.db.repos.audit_log_repo import AuditLogRepository
from workspace.db.tables.audit_log import AuditLog
from workspace.events.payloads import extract_event_payload


class AuditLogger:
    def __init__(self, audit_repo: AuditLogRepository) -> None:
        self.audit_repo = audit_repo

    async def handle_event(self, event) -> None:
        event_type = event.type.value if hasattr(event.type, "value") else str(event.type)
        if not str(event_type).startswith("discussion."):
            return
        payload = extract_event_payload(event)
        log = AuditLog(
            id=str(ULID()),
            actor_id=event.actor_id,
            action=event_type,
            target_id=event.target_id,
            target_type=event.target_type,
            details=payload or {},
        )
        await self.audit_repo.create(log)
