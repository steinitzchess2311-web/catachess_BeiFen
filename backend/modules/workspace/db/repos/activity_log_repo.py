from sqlalchemy.ext.asyncio import AsyncSession

from workspace.db.tables.activity_log import ActivityLog


class ActivityLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, log: ActivityLog) -> ActivityLog:
        self.session.add(log)
        await self.session.flush()
        return log
