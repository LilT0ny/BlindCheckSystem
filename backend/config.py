from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str
    database_name: str
    secret_key: str
    encryption_key: str
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"

settings = Settings()
