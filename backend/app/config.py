import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CIVIC PULSE"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "civic-pulse-secure-development-key-32-chars-min-safe"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./civic_pulse.db"
    
    # CORS
    FRONTEND_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    @field_validator("FRONTEND_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Storage
    UPLOAD_STORAGE_BACKEND: str = "local"
    UPLOAD_STORAGE_PATH: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    
    # AI & Geospatial settings
    AI_MODEL_NAME: str = "tfidf_logreg_baseline"
    AI_CONFIDENCE_THRESHOLD: float = 0.65
    DUPLICATE_DISTANCE_METERS: float = 150.0
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.70
    
    # Priority Scoring Weights
    PRIORITY_SAFETY_WEIGHT: float = 0.35
    PRIORITY_SEVERITY_WEIGHT: float = 0.25
    PRIORITY_AGE_WEIGHT: float = 0.20
    PRIORITY_ACCESSIBILITY_WEIGHT: float = 0.10
    PRIORITY_DUPLICATE_WEIGHT: float = 0.10
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 10
    
    # Notifications / Email
    EMAIL_PROVIDER_ENABLED: bool = False
    SMTP_HOST: str = "smtp.example.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "notifications@civicpulse.local"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
