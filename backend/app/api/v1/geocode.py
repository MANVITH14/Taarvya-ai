"""Geocoding API endpoints."""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.geocoding import geocode_place, search_places

router = APIRouter()


class PlaceResolveRequest(BaseModel):
    place_name: str


@router.get("/search")
async def search(
    q: str = Query(..., min_length=2, description="Place search query"),
    limit: int = Query(8, ge=1, le=20),
):
    """Autocomplete search for cities/towns."""
    try:
        results = await search_places(q, limit=limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Place search failed: {str(e)}")


@router.post("/resolve")
async def resolve(payload: PlaceResolveRequest):
    """Resolve a specific place name to latitude, longitude, and IANA timezone."""
    if not payload.place_name.strip():
        raise HTTPException(status_code=400, detail="Place name cannot be empty")
    try:
        result = await geocode_place(payload.place_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding error: {str(e)}")
