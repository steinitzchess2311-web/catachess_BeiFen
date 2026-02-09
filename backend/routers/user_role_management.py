"""
User Role Management API
Allows admins to manage user roles without direct database access
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import create_engine, text, select
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os

from core.security.current_user import get_current_user_dep
from models.user import User

router = APIRouter(prefix="/api/admin/roles", tags=["User Role Management"])


class RoleUpdateRequest(BaseModel):
    """Request to update user role"""
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None
    new_role: str  # 'student', 'teacher', 'editor', 'admin'


class BatchRoleUpdateRequest(BaseModel):
    """Request to update multiple users' roles"""
    user_ids: Optional[List[str]] = None
    emails: Optional[List[EmailStr]] = None
    new_role: str


class UserRoleInfo(BaseModel):
    """User role information"""
    id: str
    identifier: str
    username: Optional[str]
    role: str
    is_active: bool


def get_db():
    """Get database session"""
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

    engine = create_engine(db_url)
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()


def require_admin(current_user: User = Depends(get_current_user_dep)):
    """Require user to be admin"""
    if not current_user or current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin role required for this operation"
        )
    return current_user


@router.get("/users", response_model=List[UserRoleInfo])
async def list_all_users(
    role_filter: Optional[str] = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all users with their roles (admin only)

    Query params:
    - role_filter: Filter by role (student/teacher/editor/admin)
    """
    try:
        if role_filter:
            query = text("""
                SELECT id, identifier, username, role, is_active
                FROM users
                WHERE role = :role
                ORDER BY created_at DESC
            """)
            result = db.execute(query, {"role": role_filter})
        else:
            query = text("""
                SELECT id, identifier, username, role, is_active
                FROM users
                ORDER BY created_at DESC
            """)
            result = db.execute(query)

        users = []
        for row in result:
            users.append({
                "id": str(row[0]),
                "identifier": row[1],
                "username": row[2],
                "role": row[3],
                "is_active": row[4]
            })

        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")


@router.post("/update")
async def update_user_role(
    request: RoleUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update a single user's role (admin only)

    Provide either user_id or email
    """
    # Validate role
    valid_roles = ['student', 'teacher', 'editor', 'admin']
    if request.new_role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )

    try:
        if request.user_id:
            # Update by user_id
            result = db.execute(
                text("UPDATE users SET role = :role WHERE id = :user_id RETURNING id, identifier, role"),
                {"role": request.new_role, "user_id": request.user_id}
            )
        elif request.email:
            # Update by email
            result = db.execute(
                text("UPDATE users SET role = :role WHERE identifier = :email RETURNING id, identifier, role"),
                {"role": request.new_role, "email": request.email}
            )
        else:
            raise HTTPException(status_code=400, detail="Must provide either user_id or email")

        updated = result.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="User not found")

        db.commit()

        return {
            "success": True,
            "message": f"User role updated to {request.new_role}",
            "user": {
                "id": str(updated[0]),
                "identifier": updated[1],
                "role": updated[2]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")


@router.post("/batch-update")
async def batch_update_roles(
    request: BatchRoleUpdateRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update multiple users' roles at once (admin only)

    Provide either user_ids or emails list
    """
    # Validate role
    valid_roles = ['student', 'teacher', 'editor', 'admin']
    if request.new_role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )

    try:
        updated_count = 0

        if request.user_ids:
            # Update by user_ids
            for user_id in request.user_ids:
                result = db.execute(
                    text("UPDATE users SET role = :role WHERE id = :user_id"),
                    {"role": request.new_role, "user_id": user_id}
                )
                updated_count += result.rowcount
        elif request.emails:
            # Update by emails
            for email in request.emails:
                result = db.execute(
                    text("UPDATE users SET role = :role WHERE identifier = :email"),
                    {"role": request.new_role, "email": email}
                )
                updated_count += result.rowcount
        else:
            raise HTTPException(status_code=400, detail="Must provide either user_ids or emails")

        db.commit()

        return {
            "success": True,
            "message": f"Updated {updated_count} user(s) to role {request.new_role}",
            "updated_count": updated_count
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to batch update roles: {str(e)}")


@router.post("/promote-to-admin")
async def promote_user_to_admin(
    email: EmailStr,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Quick endpoint to promote a user to admin (admin only)
    """
    try:
        result = db.execute(
            text("UPDATE users SET role = 'admin' WHERE identifier = :email RETURNING id, identifier, username"),
            {"email": email}
        )

        updated = result.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail=f"User with email {email} not found")

        db.commit()

        return {
            "success": True,
            "message": f"User {email} promoted to admin",
            "user": {
                "id": str(updated[0]),
                "identifier": updated[1],
                "username": updated[2],
                "role": "admin"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to promote user: {str(e)}")


@router.get("/stats")
async def get_role_statistics(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get statistics about user roles (admin only)
    """
    try:
        result = db.execute(text("""
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
            ORDER BY count DESC
        """))

        stats = {}
        total = 0
        for row in result:
            role, count = row
            stats[role] = count
            total += count

        return {
            "total_users": total,
            "by_role": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")
