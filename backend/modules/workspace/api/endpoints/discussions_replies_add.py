from fastapi import APIRouter, Depends, HTTPException, status

from workspace.api.audit_helpers import log_permission_denial
from workspace.api.deps import (
    get_acl_repo,
    get_audit_repo,
    get_current_user_id,
    get_node_repo,
    get_rate_limiter,
    get_reply_service,
    get_thread_repo,
)
from workspace.api.rate_limit import RateLimiter
from workspace.api.schemas.discussion_reply import ReplyCreate, ReplyResponse
from workspace.db.repos.acl_repo import ACLRepository
from workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from workspace.db.repos.node_repo import NodeRepository
from workspace.domain.models.discussion_reply import AddReplyCommand
from workspace.domain.policies.discussion_permissions import (
    DiscussionPermissionError, require_commenter_access
)
from workspace.domain.policies.limits import DiscussionLimits
from workspace.domain.services.discussion.reply_service import ReplyService
from workspace.domain.services.discussion.nesting import NestingDepthExceededError

router = APIRouter(tags=["discussions"])


@router.post(
    "/discussions/{thread_id}/replies",
    response_model=ReplyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_reply(
    thread_id: str,
    data: ReplyCreate,
    user_id: str = Depends(get_current_user_id),
    service: ReplyService = Depends(get_reply_service),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    node_repo: NodeRepository = Depends(get_node_repo),
    acl_repo: ACLRepository = Depends(get_acl_repo),
    audit_repo = Depends(get_audit_repo),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
) -> ReplyResponse:
    try:
        thread = await thread_repo.get_by_id(thread_id)
        if not thread:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found"
            )
        await require_commenter_access(node_repo, acl_repo, thread.target_id, user_id)
        if not rate_limiter.allow(
            f"discussion:reply:{user_id}",
            DiscussionLimits.MAX_REPLIES_PER_MINUTE,
            60,
        ):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )
        command = AddReplyCommand(
            thread_id=thread_id,
            author_id=user_id,
            content=data.content,
            parent_reply_id=data.parent_reply_id,
            quote_reply_id=data.quote_reply_id,
        )
        reply = await service.add_reply(command)
        return ReplyResponse.model_validate(reply)
    except NestingDepthExceededError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
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
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
