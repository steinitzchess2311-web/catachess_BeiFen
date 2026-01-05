"""
Security Module - Authentication & Authorization

This module provides a complete separation of concerns for security:

Architecture:
    Authentication (WHO) → Authorization (WHAT) → FastAPI Integration

Components:
    - password.py: Password hashing and verification
    - jwt.py: JWT token encoding/decoding
    - current_user.py: Identity layer - answers "Who is this user?"
    - permissions.py: Authorization layer - answers "Can they do this?"
    - deps.py: FastAPI dependency glue - combines auth + permissions
    - schemas.py: Data models for tokens and authenticated users

Key Principle:
    current_user ≠ permissions
    Identity (Authentication) ≠ Authority (Authorization)
"""
