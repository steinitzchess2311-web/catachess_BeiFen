"""
Tagger database session (separate DB)
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from core.config import settings


def _get_tagger_db_url() -> str:
    url = settings.TAGGER_DATABASE_URL
    if not url:
        raise RuntimeError("TAGGER_DATABASE_URL is not set")
    return url


tagger_engine = create_engine(
    _get_tagger_db_url(),
    pool_pre_ping=True,
)

TaggerSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=tagger_engine,
)


def get_tagger_db():
    """
    FastAPI dependency that provides a tagger database session.
    Automatically closes the session after the request.
    """
    db = TaggerSessionLocal()
    try:
        yield db
    finally:
        db.close()
