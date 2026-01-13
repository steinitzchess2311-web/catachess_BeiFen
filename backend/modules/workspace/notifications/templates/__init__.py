"""Notification templates."""
from modules.workspace.notifications.templates.discussion_mention import DiscussionMentionTemplate
from modules.workspace.notifications.templates.export_complete import ExportCompleteTemplate
from modules.workspace.notifications.templates.share_invite import ShareInviteTemplate
from modules.workspace.notifications.templates.study_update import StudyUpdateTemplate

__all__ = [
    "DiscussionMentionTemplate",
    "ShareInviteTemplate",
    "ExportCompleteTemplate",
    "StudyUpdateTemplate",
]
