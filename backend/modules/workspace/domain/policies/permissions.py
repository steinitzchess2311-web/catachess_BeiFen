from workspace.domain.models.types import Permission
from workspace.domain.policies.discussion_permissions import (
    DiscussionPermissionError,
    require_admin_access,
    require_commenter_access,
    require_editor_access,
)
from workspace.domain.policies.permissions_core import PermissionPolicy
from workspace.domain.policies.permissions_inheritance import InheritancePolicy


async def check_discussion_permission(
    node_repo,
    acl_repo,
    target_id: str,
    user_id: str,
    required: Permission,
) -> None:
    if required == Permission.COMMENTER:
        await require_commenter_access(node_repo, acl_repo, target_id, user_id)
        return
    if required == Permission.EDITOR:
        await require_editor_access(node_repo, acl_repo, target_id, user_id)
        return
    if required in {Permission.ADMIN, Permission.OWNER}:
        await require_admin_access(node_repo, acl_repo, target_id, user_id)
        return
    raise DiscussionPermissionError("Unsupported permission level")
