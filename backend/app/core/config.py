"""
Taarvya AI — FastAPI Backend
Configuration and settings management.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Taarvya AI"
    environment: str = "development"
    debug: bool = False
    log_level: str = "info"
    version: str = "1.0.0"

    # Database (defaults to local SQLite for seamless testing/dev; overridden by env in Docker/prod)
    database_url: str = "sqlite+aiosqlite:///./taarvya.db"

    # Security
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # CORS
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost,http://127.0.0.1"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    # OpenAI (optional)
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"

    # Email (optional)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: str = "noreply@taarvya.ai"

    # Geocoding
    google_maps_api_key: Optional[str] = None

    # Swiss Ephemeris data path
    ephe_path: str = ""

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def ai_available(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
