"""
Current User Module - Authentication Layer (Identity)

Purpose:
    Answers the question: "WHO is making this request?"
    This is ONLY about IDENTITY, not about PERMISSIONS.

Core Responsibility:
    get_current_user() -> User
        1. Extract JWT token from request header (Authorization: Bearer <token>)
        2. Decode token to get user_id
        3. Query database to get User object
        4. Return authenticated User

What This Module DOES:
    ✓ Parse Authorization header
    ✓ Decode JWT token
    ✓ Validate token signature and expiration
    ✓ Load user from database
    ✓ Raise 401 if token invalid/expired/missing

What This Module DOES NOT DO:
    ✗ Check if user is teacher/student (that's permissions.py)
    ✗ Check if user can access a resource (that's permissions.py)
    ✗ Check if user owns something (that's business logic)

Example Usage in Router:
    @router.get("/profile")
    def get_profile(current_user: User = Depends(get_current_user)):
        # current_user is guaranteed to be authenticated
        # but we don't know if they have specific permissions yet
        return current_user

Error Cases:
    - No token provided -> 401 Unauthorized
    - Invalid token -> 401 Unauthorized
    - Expired token -> 401 Unauthorized
    - User not found in DB -> 401 Unauthorized

Key Principle:
    Authentication = Prove you are who you say you are
    This module stops at identity verification, nothing more.
"""
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from core.db.deps import get_db
from core.security.jwt import decode_token
from core.log.log_auth import logger
from core.errors import InvalidTokenError, UserInactiveError
from models.user import User

# OAuth2 scheme - extracts token from Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Get current authenticated user from JWT token.

    This is a FastAPI dependency that:
    1. Extracts token from Authorization header
    2. Decodes and validates token
    3. Loads user from database
    4. Returns authenticated User object

    Args:
        token: JWT token from Authorization header (auto-extracted)
        db: Database session (auto-injected)

    Returns:
        Authenticated User object

    Raises:
        HTTPException: 401 if token invalid or user not found/inactive

    Example:
        @router.get("/me")
        def get_me(current_user: User = Depends(get_current_user)):
            return current_user
    """
    # SECURITY FIX: Removed token prefix logging to prevent token exposure in logs
    logger.debug("Authenticating request")

    # Decode token to get user_id
    user_id = decode_token(token)

    if not user_id:
        logger.warning("Token decode failed: invalid or expired token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Load user from database
    logger.debug("Loading user from database")
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        # SECURITY FIX: Don't log the invalid user_id to prevent log injection
        logger.warning("Invalid UUID format in token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, user_uuid)

    if not user:
        # SECURITY FIX: Don't log user_id for missing users
        logger.warning("User not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        # SECURITY FIX: Reduced logging - only log role, not identifiers
        logger.warning(f"Inactive user authentication attempt: role={user.role}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # SECURITY FIX: Reduced logging - only log role for successful auth
    logger.info(f"User authenticated successfully: role={user.role}")

    return user


# For testing without FastAPI (pure Python)
def get_current_user_sync(token: str, db: Session) -> User:
    """
    Synchronous version for testing without FastAPI context.

    Args:
        token: JWT token string
        db: Database session

    Returns:
        Authenticated User object

    Raises:
        InvalidTokenError: If token is invalid
        UserInactiveError: If user is inactive
    """
    user_id = decode_token(token)

    if not user_id:
        logger.warning("Token decode failed")
        raise InvalidTokenError()

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        # SECURITY FIX: Don't log the invalid user_id
        logger.warning("Invalid UUID format in token")
        raise InvalidTokenError("Invalid user ID format")

    user = db.get(User, user_uuid)

    if not user:
        # SECURITY FIX: Don't log user_id for missing users
        logger.warning("User not found")
        raise InvalidTokenError("User not found")

    if not user.is_active:
        # SECURITY FIX: Reduced logging
        logger.warning(f"User inactive: role={user.role}")
        raise UserInactiveError(user.identifier)

    # SECURITY FIX: Reduced logging
    logger.info(f"User authenticated: role={user.role}")

    return user
