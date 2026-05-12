from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    CLERK_SECRET_KEY: str
    CLERK_JWKS_URL: str
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()