"""Database table definitions"""

from modules.workspace.db.tables.acl import ACL, ShareLink
from modules.workspace.db.tables.activity_log import ActivityLog
from modules.workspace.db.tables.events import Event
from modules.workspace.db.tables.notifications import Notification
from modules.workspace.db.tables.notification_preferences import NotificationPreference
from modules.workspace.db.tables.nodes import Node
from modules.workspace.db.tables.studies import Chapter, Study
from modules.workspace.db.tables.variations import MoveAnnotation, Variation
from modules.workspace.db.tables.discussion_threads import DiscussionThread, ThreadType
from modules.workspace.db.tables.discussion_replies import DiscussionReply
from modules.workspace.db.tables.discussion_reactions import DiscussionReaction
from modules.workspace.db.tables.search_index import SearchIndex
from modules.workspace.db.tables.audit_log import AuditLog
from modules.workspace.db.tables.users import User

__all__ = [
    "Node",
    "ACL",
    "ShareLink",
    "Event",
    "Study",
    "Chapter",
    "Variation",
    "MoveAnnotation",
    "DiscussionThread",
    "DiscussionReply",
    "DiscussionReaction",
    "ThreadType",
    "SearchIndex",
    "Notification",
    "NotificationPreference",
]
