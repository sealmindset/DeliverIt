from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # OIDC
    OIDC_ISSUER_URL: str = "http://mock-oidc:10090"
    OIDC_CLIENT_ID: str = "deliverit"
    OIDC_CLIENT_SECRET: str = "deliverit-secret"

    # JWT
    JWT_SECRET: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://deliverit:deliverit@db:5432/deliverit"

    # URLs
    FRONTEND_URL: str = "http://localhost:3002"
    BACKEND_URL: str = "http://localhost:8002"

    # Jira
    JIRA_BASE_URL: str = "http://mock-jira:8443"
    JIRA_AUTH_TOKEN: str = "mock-jira-token"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
