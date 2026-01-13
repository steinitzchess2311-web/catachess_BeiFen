"""
Discussion reply history endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from modules.workspace.api.audit_helpers import log_permission_denial
from modules.workspace.api.deps import (
    get_acl_repo,
    get_audit_repo,
    get_current_user_id,
    get_node_repo,
    get_reply_repo,
    get_thread_repo,
)
from modules.workspace.api.schemas.discussion_reply import ReplyEditHistoryEntry
from modules.workspace.db.repos.acl_repo import ACLRepository
from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.node_repo import NodeRepository
from modules.workspace.domain.policies.discussion_permissions import (
    DiscussionPermissionError,
    require_commenter_access,
)

router = APIRouter(prefix="/replies", tags=["discussions"])


@router.get("/{reply_id}/history", response_model=list[ReplyEditHistoryEntry])
async def get_reply_history(
    reply_id: str,
    repo: DiscussionReplyRepository = Depends(get_reply_repo),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    user_id: str = Depends(get_current_user_id),
    node_repo: NodeRepository = Depends(get_node_repo),
    acl_repo: ACLRepository = Depends(get_acl_repo),
    audit_repo = Depends(get_audit_repo),
) -> list[ReplyEditHistoryEntry]:
    try:
        reply = await repo.get_by_id(reply_id)
        if not reply:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found")
        thread = await thread_repo.get_by_id(reply.thread_id)
        if not thread:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")
        await require_commenter_access(node_repo, acl_repo, thread.target_id, user_id)
        return [
            ReplyEditHistoryEntry.model_validate(entry)
            for entry in reply.edit_history
        ]
    except DiscussionPermissionError as exc:
        await log_permission_denial(
            audit_repo,
            user_id,
            thread.target_id,
            thread.target_type,
            "commenter",
            str(exc),
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
