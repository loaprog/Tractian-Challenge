from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
from sqlalchemy.orm import declarative_base

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        populate_by_name=True,
    )

    db_url: str = Field(..., alias="DATABASE_URL")

@lru_cache()
def get_settings() -> Settings:
    return Settings()

Base = declarative_base()
