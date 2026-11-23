
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from app.api.routes.auth_test import (
    router as auth_test_router,
)
from app.api.routes.profile import (
    router as profile_router,
)

from app.api.routes.fitness_profile import (
    router as fitness_profile_router,
)

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

app.include_router(
    fitness_profile_router,
    prefix="/api/v1",
)

app.include_router(
    profile_router,
    prefix="/api/v1",
)

app.include_router(
    auth_test_router,
    prefix="/api/v1",
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
