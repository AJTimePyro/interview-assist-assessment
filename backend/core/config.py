from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen-3.5"
    OLLAMA_NUM_CTX: int = 8192
    OLLAMA_KEEP_ALIVE: str = "30m"

    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
