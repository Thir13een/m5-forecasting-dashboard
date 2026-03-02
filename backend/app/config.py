from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_dir: str = "/app/data/models"
    data_dir: str = "/app/data/models"
    groq_api_key: str = ""
    database_url: str = "postgresql://m5:m5pass@postgres:5432/m5db"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
