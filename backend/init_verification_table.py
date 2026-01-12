"""
Initialize verification_codes table if it doesn't exist
Run this on Railway deployment
"""
import psycopg2
from core.config import settings

def init_verification_table():
    """Create verification_codes table if not exists"""
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        cur = conn.cursor()

        # Create table with VARCHAR types to match existing users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS verification_codes (
                id VARCHAR(64) PRIMARY KEY,
                user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                code_hash VARCHAR(255) NOT NULL,
                purpose VARCHAR(50) NOT NULL DEFAULT 'signup',
                expires_at TIMESTAMP NOT NULL,
                consumed_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        """)

        # Create indexes
        cur.execute("""
            CREATE INDEX IF NOT EXISTS ix_verification_codes_user_id
            ON verification_codes(user_id);
        """)

        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_verification_active
            ON verification_codes(user_id, purpose, consumed_at);
        """)

        conn.commit()
        cur.close()
        conn.close()

        print("✓ verification_codes table initialized successfully")
        return True

    except Exception as e:
        print(f"✗ Failed to initialize verification_codes table: {e}")
        return False

if __name__ == "__main__":
    init_verification_table()
