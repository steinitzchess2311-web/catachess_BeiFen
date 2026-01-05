"""
Security Schemas Module - Data Models for Authentication

Purpose:
    Defines Pydantic models for security-related data structures.
    These are used for validation, serialization, and type hints.

Core Schemas:
    1. TokenPayload
        - Represents the decoded JWT payload
        - Fields:
            * sub: str (subject - usually user_id)
            * exp: int (expiration timestamp)
            * iat: int (issued at timestamp)
            * Optional: role, permissions
        - Used when decoding JWT tokens

    2. TokenResponse
        - API response when issuing tokens
        - Fields:
            * access_token: str
            * token_type: str = "bearer"
            * expires_in: int (optional)
        - Returned by login endpoint

    3. AuthUser
        - Represents an authenticated user (subset of full User model)
        - Fields typically include:
            * id: str/int
            * username: str
            * email: str
            * role: str (teacher/student/admin)
        - Returned by /me endpoint or after authentication
        - Doesn't include sensitive fields (password_hash, etc.)

Why Separate from User Model:
    - User model may have many fields (created_at, updated_at, etc.)
    - AuthUser only includes security-relevant fields
    - Prevents accidentally exposing sensitive data
    - Clear contract for authentication responses

Example Schemas:
    class TokenPayload(BaseModel):
        sub: str  # user_id
        exp: int
        role: str

    class TokenResponse(BaseModel):
        access_token: str
        token_type: str = "bearer"

    class AuthUser(BaseModel):
        id: int
        username: str
        email: str
        role: str

        class Config:
            from_attributes = True

Usage Flow:
    Login -> create token -> TokenResponse
    Request -> decode token -> TokenPayload -> query DB -> AuthUser
"""
