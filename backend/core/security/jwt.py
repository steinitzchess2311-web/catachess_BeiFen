"""
JWT Module - Token Encoding & Decoding

Purpose:
    Handles JWT (JSON Web Token) creation and validation for stateless authentication.

Responsibilities:
    1. create_access_token(data: dict) -> str
       - Encodes user data (typically user_id, role) into JWT
       - Adds expiration time
       - Signs with SECRET_KEY
       - Returns token string

    2. decode_access_token(token: str) -> dict
       - Decodes JWT token
       - Verifies signature and expiration
       - Returns payload data (user_id, etc.)
       - Raises exception if invalid/expired

Token Payload Typically Contains:
    - sub: subject (user_id)
    - exp: expiration timestamp
    - iat: issued at timestamp
    - Optional: role, permissions, etc.

Security Considerations:
    - Use strong SECRET_KEY (from environment)
    - Set appropriate expiration times (e.g., 30 minutes)
    - Use HS256 or RS256 algorithm
    - Never put sensitive data in payload (it's base64, not encrypted)

Example Flow:
    Login success -> create_access_token(user_id) -> return to client
    Request -> extract token -> decode_access_token() -> get user_id
"""
