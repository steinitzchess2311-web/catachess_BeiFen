from modules.workspace.domain.models.acl import ACLModel


class InheritancePolicy:
    @staticmethod
    def should_inherit_to_children(acl: ACLModel) -> bool:
        return acl.inherit_to_children and not acl.is_inherited

    @staticmethod
    def create_inherited_acl(
        parent_acl: ACLModel, child_object_id: str
    ) -> dict[str, any]:
        return {
            "object_id": child_object_id,
            "user_id": parent_acl.user_id,
            "permission": parent_acl.permission,
            "inherit_to_children": True,
            "is_inherited": True,
            "inherited_from": parent_acl.object_id,
            "granted_by": parent_acl.granted_by,
        }

    @staticmethod
    def should_propagate_changes(acl: ACLModel, changed_field: str) -> bool:
        if not acl.inherit_to_children:
            return False
        return changed_field in {"permission", "inherit_to_children"}
