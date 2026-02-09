"""
Database engine configuration
"""
from sqlalchemy import create_engine
from core.config import settings

db_engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,                          # Check connection health before using
    pool_size=settings.DB_POOL_SIZE,             # Base connection pool size (default: 20)
    max_overflow=settings.DB_MAX_OVERFLOW,       # Additional connections when pool is exhausted (default: 40)
    pool_recycle=settings.DB_POOL_RECYCLE,       # Recycle connections after seconds (default: 3600 = 1 hour)
    pool_timeout=settings.DB_POOL_TIMEOUT,       # Wait seconds for a connection before timing out (default: 30)
    echo_pool=False,                             # Disable pool logging for performance
)
