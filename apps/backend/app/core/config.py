from pydantic_settings import BaseSettings

# Base will read your.env file , convert values to correct values and make them accessible via settings variable
class Settings(BaseSettings):
    PROJECT_NAME: str = "Spendflow"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str 
    JWT_SECRET_KEY: str 
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    FRONTEND_BASE_URL: str #frontend onboarding URL for password setup emails.


    # Email config for sending emails to supplier
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    FROM_EMAIL: str
    SMTP_USE_TLS: bool = True

    class Config:
        env_file = ".env"

settings = Settings()