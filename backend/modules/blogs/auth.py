"""
Blog Authentication and Authorization

Permission levels:
- Public: Can view published articles
- Editor: Can create and edit articles
- Admin: Can delete articles and manage everything
"""
import os
from typing import Optional
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

# Import User model and auth from main app
import sys
from pathlib import Path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from models.user import User
from core.security.current_user import get_current_user as get_current_user_main
from core.db.deps import get_db


def get_blog_db():
    """Get blog database session (same as main app database)"""
    # Use main app's database session
    return get_db()


def get_current_user(
    current_user: User = Depends(get_current_user_main)
) -> User:
    """
    Get current authenticated user using main app's JWT auth system

    This wraps the main app's get_current_user to work with blog endpoints.
    Raises 401 if not authenticated.
    """
    return current_user


def require_editor(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require user to be editor or admin

    get_current_user already ensures user is authenticated (raises 401 if not).
    This function checks role permissions.
    """
    if current_user.role not in ["editor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Editor or admin role required"
        )

    return current_user


def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require user to be admin

    get_current_user already ensures user is authenticated (raises 401 if not).
    This function checks admin permission.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin role required"
        )

    return current_user
