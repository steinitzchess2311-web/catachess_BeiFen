from modules.workspace.db.repos.activity_log_repo import ActivityLogRepository
from modules.workspace.db.repos.audit_log_repo import AuditLogRepository
from modules.workspace.db.repos.discussion_reaction_repo import DiscussionReactionRepository
from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.node_repo import NodeRepository
from modules.workspace.db.repos.notification_repo import NotificationRepository
from modules.workspace.db.repos.search_index_repo import SearchIndexRepository
from modules.workspace.db.repos.study_repo import StudyRepository
from modules.workspace.db.repos.user_repo import UserRepository
from modules.workspace.db.repos.variation_repo import VariationRepository
from modules.workspace.events.subscribers.activity_logger import ActivityLogger
from modules.workspace.events.subscribers.audit_logger import AuditLogger
from modules.workspace.events.subscribers.mention_notifier import MentionNotifier
from modules.workspace.events.subscribers.notification_creator import NotificationCreator
from modules.workspace.events.subscribers.search_indexer import register_search_indexer


def register_all_subscribers(bus, session) -> None:
    thread_repo = DiscussionThreadRepository(session)
    reply_repo = DiscussionReplyRepository(session)
    reaction_repo = DiscussionReactionRepository(session)
    node_repo = NodeRepository(session)
    study_repo = StudyRepository(session)
    variation_repo = VariationRepository(session)
    search_repo = SearchIndexRepository(session)
    user_repo = UserRepository(session)
    notification_repo = NotificationRepository(session)
    activity_repo = ActivityLogRepository(session)
    audit_repo = AuditLogRepository(session)

    register_search_indexer(
        bus,
        thread_repo,
        reply_repo,
        search_repo,
        node_repo=node_repo,
        study_repo=study_repo,
        variation_repo=variation_repo,
    )
    bus.subscribe(
        MentionNotifier(bus, thread_repo, reply_repo, user_repo).handle_event
    )
    bus.subscribe(
        NotificationCreator(
            notification_repo, thread_repo, reply_repo, reaction_repo
        ).handle_event
    )
    bus.subscribe(ActivityLogger(activity_repo).handle_event)
    bus.subscribe(AuditLogger(audit_repo).handle_event)
