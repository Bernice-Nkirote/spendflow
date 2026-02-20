from pydantic_settings import BaseSettings

# Base will read your.env file , convert values to correct values and make them accessible via settings variable
class Settings(BaseSettings):
    PROJECT_NAME: str = "Spendflow"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str 
    JWT_SECRET_KEY: str 
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"

settings = Settings()