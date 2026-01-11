from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from workspace.db.tables.notifications import Notification


class NotificationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, notification: Notification) -> Notification:
        self.session.add(notification)
        await self.session.flush()
        return notification

    async def list_by_user(self, user_id: str) -> list[Notification]:
        result = await self.session.execute(
            select(Notification).where(Notification.user_id == user_id)
        )
        return list(result.scalars().all())
