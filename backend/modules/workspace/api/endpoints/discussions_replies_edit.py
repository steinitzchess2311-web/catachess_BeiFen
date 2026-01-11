from fastapi import APIRouter, Depends, HTTPException, status

from workspace.api.audit_helpers import log_permission_denial
from workspace.api.deps import (
    get_audit_repo,
    get_current_user_id,
    get_reply_repo,
    get_reply_service,
)
from workspace.api.schemas.discussion_reply import ReplyResponse, ReplyUpdate
from workspace.db.repos.discussion_reply_repo import DiscussionReplyRepository
from workspace.domain.models.discussion_reply import EditReplyCommand
from workspace.domain.policies.discussion_permissions import DiscussionPermissionError
from workspace.domain.services.discussion.reply_service import (
    OptimisticLockError,
    ReplyNotFoundError,
    ReplyService,
)

router = APIRouter(tags=["discussions"])


@router.put("/replies/{reply_id}", response_model=ReplyResponse)
async def edit_reply(
    reply_id: str,
    data: ReplyUpdate,
    user_id: str = Depends(get_current_user_id),
    service: ReplyService = Depends(get_reply_service),
    reply_repo: DiscussionReplyRepository = Depends(get_reply_repo),
    audit_repo = Depends(get_audit_repo),
) -> ReplyResponse:
    try:
        reply = await reply_repo.get_by_id(reply_id)
        if not reply:
            raise ReplyNotFoundError(f"Reply {reply_id} not found")
        if reply.author_id != user_id:
            raise DiscussionPermissionError("Only author can edit reply")
        command = EditReplyCommand(
            reply_id=reply_id,
            content=data.content,
            actor_id=user_id,
            version=data.version,
        )
        reply = await service.edit_reply(command)
        return ReplyResponse.model_validate(reply)
    except ReplyNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DiscussionPermissionError as exc:
        await log_permission_denial(
            audit_repo,
            user_id,
            reply.id,
            "discussion_reply",
            "author",
            str(exc),
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except OptimisticLockError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
