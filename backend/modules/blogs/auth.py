"""
Blog Authentication and Authorization

Permission levels:
- Public: Can view published articles
- Editor: Can create and edit articles
- Admin: Can delete articles and manage everything
"""
import os
from typing import Optional
from fastapi import Depends, HTTPException, Header
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

# Import User model from main app
import sys
from pathlib import Path
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from models.user import User


def get_blog_db():
    """Get blog database session"""
    db_url = os.getenv("BLOG_DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=500, detail="BLOG_DATABASE_URL not configured")

    engine = create_engine(db_url)
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_blog_db)
) -> Optional[User]:
    """
    Get current user from Authorization header (optional)

    For now, this is a simple implementation.
    TODO: Integrate with existing JWT auth system
    """
    if not authorization:
        return None

    # Simple bearer token validation (placeholder)
    # In production, verify JWT token properly
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")

    # TODO: Decode JWT and get user_id
    # For now, return None (auth not fully implemented)
    return None


async def require_editor(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require user to be editor or admin"""
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    if current_user.role not in ["editor", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Editor or admin role required"
        )

    return current_user


async def require_admin(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require user to be admin"""
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin role required"
        )

    return current_user


# For development/testing: allow bypassing auth
def get_dev_bypass() -> bool:
    """Check if development bypass is enabled"""
    return os.getenv("BLOG_DEV_MODE", "false").lower() == "true"


async def optional_auth_or_dev(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_blog_db)
) -> Optional[User]:
    """Get user or allow if dev mode enabled"""
    if get_dev_bypass():
        # In dev mode, create a mock admin user
        mock_user = User()
        mock_user.id = "00000000-0000-0000-0000-000000000000"
        mock_user.role = "admin"
        return mock_user

    return await get_current_user(authorization, db)
