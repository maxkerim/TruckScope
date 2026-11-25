from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = (
        "postgresql+psycopg://truckscope:truckscope_dev"
        "@db:5432/truckscope"
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
