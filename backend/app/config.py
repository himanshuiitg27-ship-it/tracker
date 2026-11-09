"""Application settings, read from environment variables (see .env.example)."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env if present (never committed).
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _normalise_db_url(url: str) -> str:
    """Neon hands out `postgresql://` or `postgres://` URLs; SQLAlchemy needs a driver."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


class Settings:
    def __init__(self) -> None:
        raw = os.getenv("DATABASE_URL", "").strip()
        if not raw:
            raise RuntimeError(
                "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
                "and paste your Neon connection string."
            )
        self.database_url: str = _normalise_db_url(raw)
        origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        self.cors_origins: list[str] = [o.strip() for o in origins.split(",") if o.strip()]
        self.default_cycle_length: int = int(os.getenv("DEFAULT_CYCLE_LENGTH", "28"))
        self.default_period_length: int = int(os.getenv("DEFAULT_PERIOD_LENGTH", "5"))
        self.max_period_length: int = int(os.getenv("MAX_PERIOD_LENGTH", "15"))


def get_settings() -> Settings:
    return Settings()
