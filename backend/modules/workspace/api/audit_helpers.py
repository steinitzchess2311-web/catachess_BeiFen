from ulid import ULID

from workspace.db.repos.audit_log_repo import AuditLogRepository
from workspace.db.tables.audit_log import AuditLog


async def log_permission_denial(
    audit_repo: AuditLogRepository,
    actor_id: str,
    target_id: str,
    target_type: str,
    required_permission: str,
    reason: str,
) -> None:
    log = AuditLog(
        id=str(ULID()),
        actor_id=actor_id,
        action="discussion.permission.denied",
        target_id=target_id,
        target_type=target_type,
        details={"required_permission": required_permission, "reason": reason},
    )
    await audit_repo.create(log)
    await audit_repo.session.commit()
