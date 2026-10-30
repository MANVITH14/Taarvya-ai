"""Birth profile CRUD endpoints."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.birth_profile import BirthProfile

router = APIRouter()


class ProfileCreate(BaseModel):
    name: str
    date_of_birth: str
    time_of_birth: Optional[str] = None
    time_unknown: bool = False
    birthplace_name: str
    latitude: float
    longitude: float
    timezone_str: str
    gender: Optional[str] = None
    notes: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    time_unknown: Optional[bool] = None
    birthplace_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone_str: Optional[str] = None
    gender: Optional[str] = None
    notes: Optional[str] = None


def _profile_to_dict(p: BirthProfile) -> dict:
    return {
        "id": str(p.id),
        "user_id": str(p.user_id),
        "name": p.name,
        "date_of_birth": p.date_of_birth.isoformat(),
        "time_of_birth": p.time_of_birth.strftime("%H:%M") if p.time_of_birth else None,
        "time_unknown": p.time_unknown,
        "birthplace_name": p.birthplace_name,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "timezone_str": p.timezone_str,
        "gender": p.gender,
        "notes": p.notes,
        "is_primary": p.is_primary,
        "cached_chart": p.cached_chart,
        "created_at": p.created_at.isoformat(),
    }


async def _get_profile_owned(profile_id: str, user: User, db: AsyncSession) -> BirthProfile:
    """Fetch a profile by ID and verify ownership."""
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


@router.get("", response_model=List[dict])
async def list_profiles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all birth profiles for the current user."""
    result = await db.execute(
        select(BirthProfile)
        .where(BirthProfile.user_id == current_user.id)
        .order_by(BirthProfile.is_primary.desc(), BirthProfile.created_at)
    )
    profiles = result.scalars().all()
    return [_profile_to_dict(p) for p in profiles]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_profile(
    body: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new birth profile."""
    from datetime import date, time as time_type

    # Validate and parse date
    try:
        dob = date.fromisoformat(body.date_of_birth)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD")

    tob = None
    if body.time_of_birth and not body.time_unknown:
        try:
            tob = time_type.fromisoformat(body.time_of_birth)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid time format. Use HH:MM")

    # Validate coordinates
    if not (-90 <= body.latitude <= 90):
        raise HTTPException(status_code=422, detail="Latitude must be between -90 and 90")
    if not (-180 <= body.longitude <= 180):
        raise HTTPException(status_code=422, detail="Longitude must be between -180 and 180")

    # First profile is primary by default
    existing_count_result = await db.execute(
        select(BirthProfile).where(BirthProfile.user_id == current_user.id)
    )
    is_first = len(existing_count_result.scalars().all()) == 0

    profile = BirthProfile(
        user_id=current_user.id,
        name=body.name.strip(),
        date_of_birth=dob,
        time_of_birth=tob,
        time_unknown=body.time_unknown,
        birthplace_name=body.birthplace_name,
        latitude=body.latitude,
        longitude=body.longitude,
        timezone_str=body.timezone_str,
        gender=body.gender,
        notes=body.notes,
        is_primary=is_first,
    )
    db.add(profile)
    await db.flush()

    # Eagerly calculate chart and cache it
    try:
        from app.astrology.calculator import calculate_chart
        import dataclasses
        chart = calculate_chart(
            dob=dob, tob=tob, latitude=body.latitude,
            longitude=body.longitude, timezone_str=body.timezone_str,
            time_unknown=body.time_unknown,
        )
        profile.cached_chart = dataclasses.asdict(chart)
        profile.chart_calculated_at = datetime.now(timezone.utc)
        await db.flush()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Chart pre-calculation failed: {e}")

    await db.refresh(profile)
    return _profile_to_dict(profile)


@router.get("/{profile_id}")
async def get_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific birth profile."""
    profile = await _get_profile_owned(profile_id, current_user, db)
    return _profile_to_dict(profile)


@router.patch("/{profile_id}")
async def update_profile(
    profile_id: str,
    body: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a birth profile."""
    from datetime import date, time as time_type

    profile = await _get_profile_owned(profile_id, current_user, db)

    if body.name is not None:
        profile.name = body.name.strip()
    if body.date_of_birth is not None:
        try:
            profile.date_of_birth = date.fromisoformat(body.date_of_birth)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid date format")
    if body.time_of_birth is not None:
        try:
            profile.time_of_birth = time_type.fromisoformat(body.time_of_birth)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid time format")
    if body.time_unknown is not None:
        profile.time_unknown = body.time_unknown
    if body.birthplace_name is not None:
        profile.birthplace_name = body.birthplace_name
    if body.latitude is not None:
        profile.latitude = body.latitude
    if body.longitude is not None:
        profile.longitude = body.longitude
    if body.timezone_str is not None:
        profile.timezone_str = body.timezone_str
    if body.gender is not None:
        profile.gender = body.gender
    if body.notes is not None:
        profile.notes = body.notes

    # Invalidate cached chart
    profile.cached_chart = None
    profile.chart_calculated_at = None

    await db.flush()
    await db.refresh(profile)
    return _profile_to_dict(profile)


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a birth profile."""
    profile = await _get_profile_owned(profile_id, current_user, db)
    await db.delete(profile)
    await db.flush()


@router.post("/{profile_id}/set-primary")
async def set_primary_profile(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Set a profile as the primary profile."""
    profile = await _get_profile_owned(profile_id, current_user, db)

    # Unset all others
    all_profiles_result = await db.execute(
        select(BirthProfile).where(BirthProfile.user_id == current_user.id)
    )
    for p in all_profiles_result.scalars().all():
        p.is_primary = (p.id == profile.id)

    await db.flush()
    return {"message": f"{profile.name} is now your primary profile"}
