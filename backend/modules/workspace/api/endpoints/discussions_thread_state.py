from fastapi import APIRouter, Depends, HTTPException, status

from modules.workspace.api.audit_helpers import log_permission_denial
from modules.workspace.api.deps import (
    get_acl_repo,
    get_audit_repo,
    get_current_user_id,
    get_node_repo,
    get_thread_repo,
    get_thread_state_service,
)
from modules.workspace.api.schemas.discussion_thread import ThreadPin, ThreadResolve, ThreadResponse
from modules.workspace.db.repos.acl_repo import ACLRepository
from modules.workspace.db.repos.discussion_thread_repo import DiscussionThreadRepository
from modules.workspace.db.repos.node_repo import NodeRepository
from modules.workspace.domain.models.discussion_thread import PinThreadCommand, ResolveThreadCommand
from modules.workspace.domain.policies.discussion_permissions import (
    DiscussionPermissionError, require_editor_access
)
from modules.workspace.domain.services.discussion.thread_state_service import ThreadNotFoundError, ThreadStateService

router = APIRouter(prefix="/discussions", tags=["discussions"])


@router.patch("/{thread_id}/resolve", response_model=ThreadResponse)
async def resolve_thread(
    thread_id: str, data: ThreadResolve, user_id: str = Depends(get_current_user_id),
    service: ThreadStateService = Depends(get_thread_state_service), repo: DiscussionThreadRepository = Depends(get_thread_repo),
    node_repo: NodeRepository = Depends(get_node_repo), acl_repo: ACLRepository = Depends(get_acl_repo), audit_repo = Depends(get_audit_repo),
) -> ThreadResponse:
    try:
        thread = await repo.get_by_id(thread_id)
        if not thread:
            raise ThreadNotFoundError(f"Thread {thread_id} not found")
        if thread.author_id != user_id:
            await require_editor_access(node_repo, acl_repo, thread.target_id, user_id)
        command = ResolveThreadCommand(
            thread_id=thread_id,
            actor_id=user_id,
            resolved=data.resolved,
            version=data.version,
        )
        thread = await service.resolve_thread(command)
        return ThreadResponse.model_validate(thread)
    except ThreadNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DiscussionPermissionError as exc:
        await log_permission_denial(
            audit_repo,
            user_id,
            thread.target_id,
            thread.target_type,
            "editor",
            str(exc),
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch("/{thread_id}/pin", response_model=ThreadResponse)
async def pin_thread(
    thread_id: str, data: ThreadPin, user_id: str = Depends(get_current_user_id),
    service: ThreadStateService = Depends(get_thread_state_service), repo: DiscussionThreadRepository = Depends(get_thread_repo),
    node_repo: NodeRepository = Depends(get_node_repo), acl_repo: ACLRepository = Depends(get_acl_repo), audit_repo = Depends(get_audit_repo),
) -> ThreadResponse:
    try:
        thread = await repo.get_by_id(thread_id)
        if not thread:
            raise ThreadNotFoundError(f"Thread {thread_id} not found")
        if thread.author_id != user_id:
            await require_editor_access(node_repo, acl_repo, thread.target_id, user_id)
        command = PinThreadCommand(
            thread_id=thread_id,
            actor_id=user_id,
            pinned=data.pinned,
            version=data.version,
        )
        thread = await service.pin_thread(command)
        return ThreadResponse.model_validate(thread)
    except ThreadNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except DiscussionPermissionError as exc:
        await log_permission_denial(
            audit_repo,
            user_id,
            thread.target_id,
            thread.target_type,
            "editor",
            str(exc),
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
