from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "BlindCheck"
    MONGODB_URL: str
    DATABASE_NAME: str = "blindcheck_db"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    DATA_ENCRYPTION_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
