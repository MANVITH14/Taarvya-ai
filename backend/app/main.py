"""
Taarvya AI — FastAPI Main Application
"""
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🌟 Taarvya AI starting — environment: {settings.environment}")
    logger.info(f"   AI available: {settings.ai_available}")
    logger.info(f"   CORS origins: {settings.cors_origins_list}")
    try:
        from app.core.database import engine, Base
        from app.models import user, birth_profile
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("   Database tables initialized successfully")
    except Exception as e:
        logger.warning(f"   Database initialization warning: {e}")
    yield
    logger.info("Taarvya AI shutting down")


app = FastAPI(
    title="Taarvya AI",
    description="Vedic Astrology API — Your Birth Chart. Your Cosmic Story.",
    version=settings.version,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict to configured origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# API Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {
        "status": "healthy",
        "version": settings.version,
        "environment": settings.environment,
        "ai_available": settings.ai_available,
    }


@app.get("/", tags=["root"])
async def root():
    return {
        "message": "Taarvya AI API",
        "docs": "/docs",
        "version": settings.version,
    }


# Global exception handler — never leak stack traces in production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    if settings.debug:
        raise exc
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred. Please try again."},
    )
