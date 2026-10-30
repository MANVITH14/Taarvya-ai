"""API v1 router — aggregates all route modules."""
from fastapi import APIRouter

from app.api.v1 import auth, profiles, charts, reports, geocode

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["birth profiles"])
api_router.include_router(charts.router, prefix="/charts", tags=["charts"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(geocode.router, prefix="/geocode", tags=["geocoding"])
