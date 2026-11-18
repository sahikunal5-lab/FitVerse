
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()

app = FastAPI(
    title="FitVerse API",
    description="Backend API for FitVerse",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)


class HealthResponse(BaseModel):
    status: str
    app: str


@app.get("/api/v1/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        app="FitVerse API"
    )
