"""
Permissions Module - Authorization Layer (Authority)

Purpose:
    Answers the question: "WHAT can this user do?"
    This is ONLY about PERMISSIONS/AUTHORIZATION, not IDENTITY.

Core Responsibilities:
    Permission checking functions that raise exceptions if user lacks authority.

What This Module DOES:
    ✓ require_teacher(user: User) -> None
        - Checks if user.role == "teacher"
        - Raises 403 Forbidden if not

    ✓ require_student(user: User) -> None
        - Checks if user.role == "student"
        - Raises 403 Forbidden if not

    ✓ require_role(required_role: Role) -> Callable
        - Returns a checker function for any role
        - Flexible for multiple roles

    ✓ Future: require_course_access(user, course_id)
    ✓ Future: require_class_member(user, class_id)

What This Module DOES NOT DO:
    ✗ Extract JWT token (that's current_user.py)
    ✗ Decode tokens (that's jwt.py)
    ✗ Query user from database by token (that's current_user.py)
    ✗ Return User objects (it only checks them)

Example Permission Functions:
    def require_teacher(user: User) -> None:
        if user.role != "teacher":
            raise HTTPException(
                status_code=403,
                detail="Teacher access required"
            )

    def require_role(role: str):
        def checker(user: User) -> None:
            if user.role != role:
                raise HTTPException(403, f"{role} access required")
        return checker

Error Cases:
    - User is student but endpoint requires teacher -> 403 Forbidden
    - User is teacher but endpoint requires admin -> 403 Forbidden

Key Principle:
    Authorization = Prove you have permission to do something
    This assumes identity is already verified by current_user.py

Difference from Authentication:
    - Authentication (401): "I don't know who you are"
    - Authorization (403): "I know who you are, but you can't do this"
"""
