# core/config.py
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # ===== basic =====
    ENV: str = "dev"
    DEBUG: bool = True

    # ===== engine =====
    ENGINE_URL: str = "http://192.168.40.33:8001"
    ENGINE_TIMEOUT: int = 60

    # ===== database =====
    DATABASE_URL: str = "sqlite:///./dev.db"

    # ===== storage =====
    DATA_ROOT: Path = Path("data")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

