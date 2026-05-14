"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "PebelAI Careers Backend"
    app_env: str = "development"
    debug: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Security
    secret_key: str
    internal_api_key: str
    allowed_origins: str = "http://localhost:3000"
    
    # Database
    database_url: str
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # AI APIs
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    
    # Google OAuth
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    
    # LinkedIn (optional)
    linkedin_email: str | None = None
    linkedin_password: str | None = None
    
    # Rate Limiting
    default_daily_email_limit: int = 5
    premium_daily_email_limit: int = 25
    enterprise_daily_email_limit: int = 50
    
    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    
    # Logging
    log_level: str = "INFO"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse allowed origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


# Global settings instance
settings = Settings()
