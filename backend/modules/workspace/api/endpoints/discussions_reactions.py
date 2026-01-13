from fastapi import APIRouter, Depends, HTTPException, status

from modules.workspace.api.audit_helpers import log_permission_denial
from modules.workspace.api.deps import (
    get_acl_repo,
    get_audit_repo,
    get_current_user_id,
    get_node_repo,
    get_rate_limiter,
    get_reaction_service,
    get_reply_repo,
    get_thread_repo,
)
from modules.workspace.api.rate_limit import RateLimiter
from modules.workspace.api.schemas.discussion_reaction import (
    ReactionCreate,
    ReactionResponse,
)
from modules.workspace.db.repos.acl_repo import ACLRepository
from modules.workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.node_repo import NodeRepository
from modules.workspace.domain.models.discussion_reaction import (
    AddReactionCommand,
    RemoveReactionCommand,
)
from modules.workspace.domain.policies.discussion_permissions import (
    DiscussionPermissionError, require_commenter_access
)
from modules.workspace.domain.policies.limits import DiscussionLimits
from modules.workspace.domain.services.discussion.reaction_service import ReactionNotFoundError, ReactionService

router = APIRouter(prefix="/reactions", tags=["discussions"])


@router.post("", response_model=ReactionResponse, status_code=status.HTTP_201_CREATED)
async def add_reaction(
    data: ReactionCreate,
    user_id: str = Depends(get_current_user_id),
    service: ReactionService = Depends(get_reaction_service),
    thread_repo: DiscussionThreadRepository = Depends(get_thread_repo),
    reply_repo: DiscussionReplyRepository = Depends(get_reply_repo),
    node_repo: NodeRepository = Depends(get_node_repo),
    acl_repo: ACLRepository = Depends(get_acl_repo),
    audit_repo = Depends(get_audit_repo),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
) -> ReactionResponse:
    try:
        if data.target_type == "thread":
            thread = await thread_repo.get_by_id(data.target_id)
            if not thread:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found"
                )
            target_id = thread.target_id
        else:
            reply = await reply_repo.get_by_id(data.target_id)
            if not reply:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Reply not found"
                )
            thread = await thread_repo.get_by_id(reply.thread_id)
            if not thread:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found"
                )
            target_id = thread.target_id
        await require_commenter_access(node_repo, acl_repo, target_id, user_id)
        if not rate_limiter.allow(
            f"discussion:reaction:{user_id}",
            DiscussionLimits.MAX_REACTIONS_PER_MINUTE,
            60,
        ):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
            )
        command = AddReactionCommand(
            target_id=data.target_id,
            target_type=data.target_type,
            user_id=user_id,
            emoji=data.emoji,
        )
        reaction = await service.add_reaction(command)
        return ReactionResponse.model_validate(reaction)
    except DiscussionPermissionError as exc:
        await log_permission_denial(
            audit_repo,
            user_id,
            target_id,
            thread.target_type,
            "commenter",
            str(exc),
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/{reaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reaction(
    reaction_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ReactionService = Depends(get_reaction_service),
) -> None:
    try:
        command = RemoveReactionCommand(reaction_id=reaction_id, user_id=user_id)
        await service.remove_reaction(command)
    except ReactionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
