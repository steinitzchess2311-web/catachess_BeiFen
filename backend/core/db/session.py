"""
Database session factory
"""
from sqlalchemy.orm import sessionmaker
from core.db.db_engine import db_engine

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=db_engine,
)
