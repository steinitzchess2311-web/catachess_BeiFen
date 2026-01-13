from ulid import ULID

from modules.workspace.db.repos.activity_log_repo import ActivityLogRepository
from modules.workspace.db.tables.activity_log import ActivityLog
from modules.workspace.events.payloads import extract_event_payload


class ActivityLogger:
    def __init__(self, activity_repo: ActivityLogRepository) -> None:
        self.activity_repo = activity_repo

    async def handle_event(self, event) -> None:
        event_type = event.type.value if hasattr(event.type, "value") else str(event.type)
        if not str(event_type).startswith("discussion."):
            return
        payload = extract_event_payload(event)
        log = ActivityLog(
            id=str(ULID()),
            actor_id=event.actor_id,
            action=event_type,
            target_id=event.target_id,
            target_type=event.target_type,
            details=payload or {},
        )
        await self.activity_repo.create(log)
