"""
Password Module - Password Hashing & Verification

Purpose:
    Handles secure password storage and verification using industry-standard algorithms.

Responsibilities:
    1. hash_password(plain_password: str) -> str
       - Takes a plain text password
       - Returns a secure hash (using bcrypt/argon2/etc.)
       - Used during user registration

    2. verify_password(plain_password: str, hashed_password: str) -> bool
       - Compares plain password against stored hash
       - Returns True if match, False otherwise
       - Used during login

Security Considerations:
    - Use bcrypt, argon2, or scrypt (NOT md5/sha1)
    - Never store passwords in plain text
    - Never log passwords or hashes
    - Use constant-time comparison to prevent timing attacks

Example Flow:
    Registration: password -> hash_password() -> store in DB
    Login: input + stored_hash -> verify_password() -> True/False
"""
import bcrypt


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password as a string
    """
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.

    Args:
        password: Plain text password to verify
        hashed_password: Previously hashed password

    Returns:
        True if password matches, False otherwise
    """
    password_bytes = password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)
