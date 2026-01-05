"""
Database engine configuration
"""
from sqlalchemy import create_engine
from core.config import settings

db_engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)
