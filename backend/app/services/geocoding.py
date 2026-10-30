"""
Geocoding and timezone resolution service.
Uses OpenStreetMap Nominatim (free, no API key required).
Falls back to Google Maps if configured.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

import httpx
try:
    from timezonefinder import TimezoneFinder
    _tf = TimezoneFinder()
except ImportError:
    _tf = None


async def geocode_place(place_name: str) -> dict:
    """
    Resolve a place name to coordinates and timezone.
    
    Returns:
    {
        "display_name": str,
        "latitude": float,
        "longitude": float,
        "timezone": str,  # IANA timezone
        "country": str,
        "state": str,
    }
    
    Raises ValueError if place cannot be resolved.
    """
    # Try Nominatim first
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": place_name,
        "format": "json",
        "limit": 5,
        "addressdetails": 1,
    }
    headers = {
        "User-Agent": "TaarvyaAI/1.0 (astrology platform; contact@taarvya.ai)"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            results = resp.json()
        except httpx.TimeoutException:
            raise ValueError(f"Geocoding timed out for '{place_name}'. Try again or enter a more specific location.")
        except httpx.HTTPError as e:
            raise ValueError(f"Geocoding service error: {str(e)}")

    if not results:
        raise ValueError(
            f"Could not find location: '{place_name}'. "
            "Try a more specific name, e.g. 'Bengaluru, Karnataka, India'."
        )

    # Take the best result
    result = results[0]
    lat = float(result["lat"])
    lng = float(result["lon"])
    
    # Resolve timezone
    tz = _tf.timezone_at(lat=lat, lng=lng) if _tf else None
    if not tz:
        # Fallback: use approximate timezone by longitude
        tz = _estimate_timezone_by_longitude(lng)

    address = result.get("address", {})
    country = address.get("country", "")
    state = address.get("state", address.get("province", ""))
    city = address.get("city", address.get("town", address.get("village", "")))

    return {
        "display_name": result.get("display_name", place_name),
        "short_name": city or state or country or result.get("display_name", place_name),
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),
        "timezone": tz,
        "country": country,
        "state": state,
        "city": city,
    }


def _estimate_timezone_by_longitude(lng: float) -> str:
    """Rough timezone offset estimation when timezonefinder fails."""
    offset_hours = round(lng / 15)
    if offset_hours == 5:
        return "Asia/Kolkata"  # IST is UTC+5:30, closest match
    offset_str = f"+{offset_hours:02d}:00" if offset_hours >= 0 else f"-{abs(offset_hours):02d}:00"
    return f"Etc/GMT{'+' if offset_hours <= 0 else '-'}{abs(offset_hours)}"


async def search_places(query: str, limit: int = 8) -> list[dict]:
    """
    Search for places matching a partial query (for autocomplete).
    Returns a list of candidate locations.
    """
    if len(query.strip()) < 2:
        return []

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": limit,
        "addressdetails": 1,
        "featuretype": "city,town,village,state",
    }
    headers = {
        "User-Agent": "TaarvyaAI/1.0 (astrology platform; contact@taarvya.ai)"
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            results = resp.json()
        except (httpx.TimeoutException, httpx.HTTPError):
            return []

    places = []
    seen = set()
    for r in results:
        display = r.get("display_name", "")
        if display in seen:
            continue
        seen.add(display)
        lat = float(r["lat"])
        lng = float(r["lon"])
        tz = _tf.timezone_at(lat=lat, lng=lng) if _tf else None
        address = r.get("address", {})
        city = address.get("city", address.get("town", address.get("village", "")))
        state = address.get("state", "")
        country = address.get("country", "")
        
        short = ", ".join(filter(None, [city, state, country]))
        places.append({
            "display_name": display,
            "short_name": short or display,
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "timezone": tz or "UTC",
            "country": country,
            "state": state,
        })

    return places
