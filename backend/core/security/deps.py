"""
Dependencies Module - FastAPI Glue Layer

Purpose:
    Combines authentication + authorization into reusable FastAPI dependencies.
    This is the INTEGRATION layer between current_user and permissions.

Why This File Exists:
    Instead of writing this in every router:
        user = Depends(get_current_user)
        require_teacher(user)

    We create pre-combined dependencies:
        teacher = Depends(get_teacher_user)

Core Dependencies:
    1. get_teacher_user(user: User = Depends(get_current_user)) -> User
        - First authenticates user (get_current_user)
        - Then checks teacher permission (require_teacher)
        - Returns authenticated teacher User
        - Router doesn't need to know permission logic

    2. get_student_user(user: User = Depends(get_current_user)) -> User
        - Authenticates user
        - Checks student permission
        - Returns authenticated student User

    3. get_admin_user (future)
    4. get_course_member (future)

Benefits:
    ✓ Routers stay clean and declarative
    ✓ Permission logic centralized
    ✓ Easy to add new role combinations
    ✓ Consistent error responses
    ✓ Type hints help IDEs and developers

Example Usage in Router:
    # Before (verbose):
    @router.post("/assignments")
    def create_assignment(
        assignment: AssignmentCreate,
        user: User = Depends(get_current_user)
    ):
        require_teacher(user)  # Easy to forget!
        return create_assignment_logic(assignment, user)

    # After (clean):
    @router.post("/assignments")
    def create_assignment(
        assignment: AssignmentCreate,
        teacher: User = Depends(get_teacher_user)
    ):
        return create_assignment_logic(assignment, teacher)

Implementation Pattern:
    def get_teacher_user(
        user: User = Depends(get_current_user)
    ) -> User:
        require_teacher(user)
        return user

Key Principle:
    This is GLUE CODE - it connects pieces but doesn't implement logic.
    All real logic lives in current_user.py and permissions.py.
"""
