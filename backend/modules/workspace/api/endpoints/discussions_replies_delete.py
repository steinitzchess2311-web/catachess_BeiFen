from fastapi import APIRouter, Depends, HTTPException, status

from workspace.api.audit_helpers import log_permission_denial
from workspace.api.deps import (
    get_acl_repo,
    get_audit_repo,
    get_current_user_id,
    get_node_repo,
    get_reply_repo,
    get_reply_service,
    get_thread_repo,
)
from workspace.db.repos.acl_repo import ACLRepository
from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.node_repo import NodeRepository
from workspace.domain.models.discussion_reply import DeleteReplyCommand
from workspace.domain.policies.discussion_permissions import (
    DiscussionPermissionError, require_admin_access
)
from workspace.domain.services.discussion.reply_service import ReplyNotFoundError, ReplyService

router = APIRouter(tags=["discussions"])


@router.delete("/replies/{reply_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reply(
    reply_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ReplyService = Depends(get_reply_service),
    reply_repo: DiscussionReplyRepository = Depends(get_reply_repo),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    node_repo: NodeRepository = Depends(get_node_repo),
    acl_repo: ACLRepository = Depends(get_acl_repo),
    audit_repo = Depends(get_audit_repo),
) -> None:
    try:
        reply = await reply_repo.get_by_id(reply_id)
        if not reply:
            raise ReplyNotFoundError(f"Reply {reply_id} not found")
        if reply.author_id != user_id:
            thread = await thread_repo.get_by_id(reply.thread_id)
            if not thread:
                raise ReplyNotFoundError("Thread not found")
            await require_admin_access(node_repo, acl_repo, thread.target_id, user_id)
        command = DeleteReplyCommand(reply_id=reply_id, actor_id=user_id)
        await service.delete_reply(command)
    except ReplyNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DiscussionPermissionError as exc:
        await log_permission_denial(
            audit_repo,
            user_id,
            thread.target_id,
            thread.target_type,
            "admin",
            str(exc),
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
