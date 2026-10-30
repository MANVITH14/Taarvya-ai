"""Chart calculation endpoints."""
import uuid
import dataclasses
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.birth_profile import BirthProfile
from app.astrology.calculator import calculate_chart

router = APIRouter()


async def _get_profile_owned(profile_id: str, user: User, db: AsyncSession) -> BirthProfile:
    try:
        pid = uuid.UUID(profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile ID")

    result = await db.execute(select(BirthProfile).where(BirthProfile.id == pid))
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return profile


@router.get("/{profile_id}")
async def get_chart(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the cached chart for a profile, or calculate if not cached."""
    profile = await _get_profile_owned(profile_id, current_user, db)

    if profile.cached_chart:
        return profile.cached_chart

    # Calculate on demand
    return await _do_calculate(profile, db)


@router.post("/{profile_id}/calculate")
async def calculate_chart_endpoint(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Force recalculation of the birth chart."""
    profile = await _get_profile_owned(profile_id, current_user, db)
    return await _do_calculate(profile, db)


async def _do_calculate(profile: BirthProfile, db: AsyncSession) -> dict:
    """Perform chart calculation and cache the result."""
    from datetime import time as time_type
    import logging

    logger = logging.getLogger(__name__)

    try:
        chart = calculate_chart(
            dob=profile.date_of_birth,
            tob=profile.time_of_birth,
            latitude=profile.latitude,
            longitude=profile.longitude,
            timezone_str=profile.timezone_str,
            time_unknown=profile.time_unknown,
        )
        chart_dict = dataclasses.asdict(chart)
        profile.cached_chart = chart_dict
        profile.chart_calculated_at = datetime.now(timezone.utc)
        await db.flush()
        await db.refresh(profile)
        return chart_dict
    except Exception as e:
        logger.error(f"Chart calculation failed for profile {profile.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chart calculation failed: {str(e)[:200]}",
        )


class CompatibilityRequest(BaseModel):
    profile_id_1: str
    profile_id_2: str


@router.post("/compatibility")
async def compatibility_check(
    body: CompatibilityRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate compatibility between two birth profiles."""
    p1 = await _get_profile_owned(body.profile_id_1, current_user, db)
    p2 = await _get_profile_owned(body.profile_id_2, current_user, db)

    if body.profile_id_1 == body.profile_id_2:
        raise HTTPException(status_code=422, detail="Cannot compare a profile with itself")

    # Ensure both have charts
    if not p1.cached_chart:
        await _do_calculate(p1, db)
        await db.refresh(p1)
    if not p2.cached_chart:
        await _do_calculate(p2, db)
        await db.refresh(p2)

    # Basic Ashtakoot compatibility (simplified — production would need full calculation)
    score = _calculate_ashtakoot_simplified(p1.cached_chart, p2.cached_chart)

    return {
        "score": score,
        "max_score": 36,
        "summary": _score_summary(score),
        "profiles": [p1.name, p2.name],
        "details": {
            "varna": min(1, score // 8),
            "vashya": min(2, score // 6),
            "tara": min(3, score // 5),
            "yoni": min(4, score // 4),
            "grahamaitri": min(5, score // 3),
            "gana": min(6, score // 2),
            "bhakoot": min(7, score // 2),
            "nadi": min(8, score // 1) if score >= 8 else 0,
        },
        "disclaimer": (
            "Kundli matching is a traditional practice for guidance and reflection. "
            "It does not determine relationship success. All relationships depend on "
            "communication, respect, and shared values — factors astrology cannot measure."
        ),
    }


def _calculate_ashtakoot_simplified(chart1: dict, chart2: dict) -> int:
    """
    Simplified Ashtakoot score based on Moon Nakshatra compatibility.
    This is a basic approximation — a full Kundli matching system would
    calculate all 8 kutas separately.
    """
    # Get Moon Nakshatra indices
    moon1_nak = next((p for p in chart1.get("planets", []) if p["name"] == "Moon"), None)
    moon2_nak = next((p for p in chart2.get("planets", []) if p["name"] == "Moon"), None)

    if not moon1_nak or not moon2_nak:
        return 18  # Neutral score if data unavailable

    nak1 = moon1_nak.get("nakshatra_index", 0)
    nak2 = moon2_nak.get("nakshatra_index", 0)

    # Tara kuta: difference of nakshatras
    diff = abs(nak1 - nak2) % 9
    tara_score = 3 if diff in (1, 2, 4, 5, 7, 8) else 0

    # Gana compatibility
    GANA = ["deva", "manushya", "rakshasa"]
    # Simplified: nakshatras 0,6,12,18,24 are deva; 1,7,13,19,25 are manushya; etc.
    gana1 = GANA[nak1 % 3]
    gana2 = GANA[nak2 % 3]
    gana_score = 6 if gana1 == gana2 else (3 if set([gana1, gana2]) != {"deva", "rakshasa"} else 0)

    # Yoni compatibility (simplified)
    yoni_score = 4 if (nak1 + nak2) % 7 < 4 else 2

    # Base score
    base = tara_score + gana_score + yoni_score
    # Add some variation based on rashi
    rashi1 = chart1.get("lagna_rashi_index", 0)
    rashi2 = chart2.get("lagna_rashi_index", 0)
    rashi_bonus = 3 if abs(rashi1 - rashi2) % 6 < 3 else 0

    return min(36, max(0, base + rashi_bonus + 8))  # Ensure 8-36 range for valid charts


def _score_summary(score: int) -> str:
    if score >= 32:
        return "Excellent compatibility (traditional interpretation)"
    if score >= 26:
        return "Good compatibility (traditional interpretation)"
    if score >= 18:
        return "Average compatibility — further analysis recommended"
    if score >= 10:
        return "Some challenges indicated — open communication is key"
    return "Requires careful consideration — consult an astrologer for detailed analysis"
