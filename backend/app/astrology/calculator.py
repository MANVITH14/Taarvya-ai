"""
Vedic Astrology Calculation Engine — Taarvya AI

Uses pyswisseph (Swiss Ephemeris) for accurate astronomical calculations.
Implements:
- Sidereal zodiac with Lahiri (Chitrapaksha) ayanamsha
- Planetary longitudes (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu)
- Ascendant (Lagna) and Placidus houses (converted to Whole Sign for Vedic)
- Moon Rashi, Nakshatra, Pada
- Vimshottari Dasha periods

CONVENTION: All longitudes are sidereal (Vedic), measured from the 
Lahiri ayanamsha starting point. Tropical (Western) longitude minus 
ayanamsha equals sidereal (Vedic) longitude.

LICENSE: Swiss Ephemeris is AGPL v3 / commercial dual-licensed.
See: https://www.astro.com/swisseph/swephprg.htm
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, datetime, time, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Nakshatra data: (name_en, name_kn, ruling_planet, degrees_span)
# 27 Nakshatras each spanning 13°20' (800 minutes)
NAKSHATRAS = [
    ("Ashwini", "ಅಶ್ವಿನಿ", "Ketu"),
    ("Bharani", "ಭರಣಿ", "Venus"),
    ("Krittika", "ಕೃತ್ತಿಕಾ", "Sun"),
    ("Rohini", "ರೋಹಿಣಿ", "Moon"),
    ("Mrigashira", "ಮೃಗಶಿರ", "Mars"),
    ("Ardra", "ಆರ್ದ್ರಾ", "Rahu"),
    ("Punarvasu", "ಪುನರ್ವಸು", "Jupiter"),
    ("Pushya", "ಪುಷ್ಯ", "Saturn"),
    ("Ashlesha", "ಆಶ್ಲೇಷ", "Mercury"),
    ("Magha", "ಮಘ", "Ketu"),
    ("Purva Phalguni", "ಪೂರ್ವ ಫಾಲ್ಗುಣಿ", "Venus"),
    ("Uttara Phalguni", "ಉತ್ತರ ಫಾಲ್ಗುಣಿ", "Sun"),
    ("Hasta", "ಹಸ್ತ", "Moon"),
    ("Chitra", "ಚಿತ್ರ", "Mars"),
    ("Swati", "ಸ್ವಾತಿ", "Rahu"),
    ("Vishakha", "ವಿಶಾಖ", "Jupiter"),
    ("Anuradha", "ಅನುರಾಧ", "Saturn"),
    ("Jyeshtha", "ಜ್ಯೇಷ್ಠ", "Mercury"),
    ("Mula", "ಮೂಲ", "Ketu"),
    ("Purva Ashadha", "ಪೂರ್ವ ಆಷಾಢ", "Venus"),
    ("Uttara Ashadha", "ಉತ್ತರ ಆಷಾಢ", "Sun"),
    ("Shravana", "ಶ್ರಾವಣ", "Moon"),
    ("Dhanishtha", "ಧನಿಷ್ಠ", "Mars"),
    ("Shatabhisha", "ಶತಭಿಷ", "Rahu"),
    ("Purva Bhadrapada", "ಪೂರ್ವ ಭಾದ್ರಪದ", "Jupiter"),
    ("Uttara Bhadrapada", "ಉತ್ತರ ಭಾದ್ರಪದ", "Saturn"),
    ("Revati", "ರೇವತಿ", "Mercury"),
]

RASHIS = [
    ("Mesha", "ಮೇಷ", "Aries"),
    ("Vrishabha", "ವೃಷಭ", "Taurus"),
    ("Mithuna", "ಮಿಥುನ", "Gemini"),
    ("Karka", "ಕರ್ಕ", "Cancer"),
    ("Simha", "ಸಿಂಹ", "Leo"),
    ("Kanya", "ಕನ್ಯ", "Virgo"),
    ("Tula", "ತುಲ", "Libra"),
    ("Vrischika", "ವೃಶ್ಚಿಕ", "Scorpio"),
    ("Dhanu", "ಧನು", "Sagittarius"),
    ("Makara", "ಮಕರ", "Capricorn"),
    ("Kumbha", "ಕುಂಭ", "Aquarius"),
    ("Meena", "ಮೀನ", "Pisces"),
]

# Vimshottari Dasha: planet -> (years, nakshatra_indices where it rules)
VIMSHOTTARI_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
VIMSHOTTARI_YEARS = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10,
    "Mars": 7, "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}
TOTAL_DASHA_YEARS = 120  # Sum of all dasha years


@dataclass
class PlanetPosition:
    name: str
    longitude: float        # Sidereal longitude (0–360°)
    rashi_index: int        # 0–11
    rashi_name: str
    rashi_name_kn: str
    degree_in_rashi: float  # 0–30°
    nakshatra_index: int    # 0–26
    nakshatra_name: str
    nakshatra_name_kn: str
    pada: int               # 1–4
    nakshatra_lord: str
    retrograde: bool = False
    is_rahu_ketu: bool = False


@dataclass
class HousePosition:
    house_number: int     # 1–12
    rashi_index: int      # Rashi at cusp
    rashi_name: str
    longitude: float      # Cusp longitude (sidereal)


@dataclass
class ChartData:
    """Complete Vedic birth chart data."""
    # Input metadata
    date_of_birth: str
    time_of_birth: str
    latitude: float
    longitude: float
    timezone_str: str
    time_unknown: bool

    # Julian Day (UT)
    julian_day: float

    # Ayanamsha
    ayanamsha: float
    ayanamsha_name: str = "Lahiri (Chitrapaksha)"

    # Ascendant
    lagna_longitude: float = 0.0
    lagna_rashi_index: int = 0
    lagna_rashi_name: str = ""
    lagna_rashi_name_kn: str = ""
    lagna_degree: float = 0.0

    # Planets
    planets: list[PlanetPosition] = field(default_factory=list)

    # Houses (Whole Sign system — standard in Vedic)
    houses: list[HousePosition] = field(default_factory=list)

    # Moon specifics
    moon_rashi: str = ""
    moon_rashi_kn: str = ""
    moon_nakshatra: str = ""
    moon_nakshatra_kn: str = ""
    moon_pada: int = 0
    moon_nakshatra_lord: str = ""

    # Vimshottari Dasha
    vimshottari_dasha: list[dict] = field(default_factory=list)

    # Calculation notes
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        import dataclasses
        return dataclasses.asdict(self)


def _longitude_to_rashi(longitude: float) -> tuple[int, float]:
    """Convert sidereal longitude to (rashi_index 0-11, degree_in_rashi 0-30)."""
    rashi_index = int(longitude / 30) % 12
    degree_in_rashi = longitude % 30
    return rashi_index, degree_in_rashi


def _longitude_to_nakshatra(longitude: float) -> tuple[int, int]:
    """Convert sidereal longitude to (nakshatra_index 0-26, pada 1-4)."""
    # Each nakshatra = 360/27 = 13.333...°
    nakshatra_span = 360.0 / 27.0
    pada_span = nakshatra_span / 4.0
    nakshatra_index = int(longitude / nakshatra_span) % 27
    pos_in_nakshatra = longitude % nakshatra_span
    pada = int(pos_in_nakshatra / pada_span) + 1
    pada = min(pada, 4)
    return nakshatra_index, pada


def datetime_to_julian(dt: datetime) -> float:
    """
    Convert a UTC datetime to Julian Day Number.
    Uses the astronomical formula (valid for proleptic Gregorian calendar).
    """
    y, m, d = dt.year, dt.month, dt.day
    h = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
    if m <= 2:
        y -= 1
        m += 12
    A = int(y / 100)
    B = 2 - A + int(A / 4)
    jdn = int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + B - 1524.5
    return jdn + h / 24.0


def _make_planet_position(name: str, longitude: float, retrograde: bool = False) -> PlanetPosition:
    """Build a PlanetPosition from a sidereal longitude."""
    rashi_idx, deg_in_rashi = _longitude_to_rashi(longitude)
    nak_idx, pada = _longitude_to_nakshatra(longitude)
    rashi = RASHIS[rashi_idx]
    nak = NAKSHATRAS[nak_idx]
    return PlanetPosition(
        name=name,
        longitude=round(longitude % 360, 4),
        rashi_index=rashi_idx,
        rashi_name=rashi[0],
        rashi_name_kn=rashi[1],
        degree_in_rashi=round(deg_in_rashi, 4),
        nakshatra_index=nak_idx,
        nakshatra_name=nak[0],
        nakshatra_name_kn=nak[1],
        pada=pada,
        nakshatra_lord=nak[2],
        retrograde=retrograde,
        is_rahu_ketu=name in ("Rahu", "Ketu"),
    )


def _calculate_vimshottari(moon_longitude: float, birth_dt: datetime) -> list[dict]:
    """
    Calculate Vimshottari Dasha periods starting from birth date.
    
    Algorithm:
    1. Find Moon's Nakshatra and position within it.
    2. Calculate the remaining balance of the current dasha.
    3. Sequence the remaining dashas in Vimshottari order.
    """
    nak_span = 360.0 / 27.0  # 13.3333...°
    nak_idx = int(moon_longitude / nak_span) % 27
    pos_in_nak = moon_longitude % nak_span
    fraction_remaining = 1.0 - (pos_in_nak / nak_span)

    # Find the ruling planet of the current nakshatra
    ruling_planet = NAKSHATRAS[nak_idx][2]
    start_planet_idx = VIMSHOTTARI_ORDER.index(ruling_planet)

    dashas = []
    current_date = birth_dt.replace(tzinfo=None)

    # First dasha: remaining balance
    first_planet = VIMSHOTTARI_ORDER[start_planet_idx]
    first_years = VIMSHOTTARI_YEARS[first_planet] * fraction_remaining
    
    end_date = _add_years(current_date, first_years)
    dashas.append({
        "planet": first_planet,
        "start": current_date.date().isoformat(),
        "end": end_date.date().isoformat(),
        "years": round(first_years, 4),
        "is_current": True,
    })
    current_date = end_date

    # Subsequent full dashas (enough to cover ~100 years)
    total_covered = first_years
    planet_idx = (start_planet_idx + 1) % 9
    while total_covered < 100:
        planet = VIMSHOTTARI_ORDER[planet_idx]
        years = VIMSHOTTARI_YEARS[planet]
        end_date = _add_years(current_date, years)
        dashas.append({
            "planet": planet,
            "start": current_date.date().isoformat(),
            "end": end_date.date().isoformat(),
            "years": years,
            "is_current": False,
        })
        current_date = end_date
        total_covered += years
        planet_idx = (planet_idx + 1) % 9

    # Mark which dasha is active today
    from datetime import date as date_type
    today = datetime.now().date()
    for d in dashas:
        d_start = date_type.fromisoformat(d["start"])
        d_end = date_type.fromisoformat(d["end"])
        d["is_current"] = d_start <= today <= d_end

    return dashas


def _add_years(dt: datetime, years: float) -> datetime:
    """Add a fractional number of years to a datetime."""
    days = years * 365.25
    from datetime import timedelta
    return dt + timedelta(days=days)


def calculate_chart(
    dob: date,
    tob: Optional[time],
    latitude: float,
    longitude: float,
    timezone_str: str,
    time_unknown: bool = False,
) -> ChartData:
    """
    Calculate a complete Vedic birth chart.
    
    Uses pyswisseph if available; falls back to an approximate calculation
    for demonstration when the library is not installed.
    
    Parameters
    ----------
    dob : date            Birth date (local time)
    tob : time | None     Birth time (local time); None if unknown
    latitude : float      Geographic latitude (north positive)
    longitude : float     Geographic longitude (east positive)
    timezone_str : str    IANA timezone name (e.g. 'Asia/Kolkata')
    time_unknown : bool   True if birth time is approximate/unknown
    """
    import pytz

    # Convert local birth datetime to UTC
    tz = pytz.timezone(timezone_str)
    if tob and not time_unknown:
        local_dt = datetime(dob.year, dob.month, dob.day, tob.hour, tob.minute, tob.second)
    else:
        # Use noon if time is unknown — standard practice
        local_dt = datetime(dob.year, dob.month, dob.day, 12, 0, 0)

    local_aware = tz.localize(local_dt)
    utc_dt = local_aware.astimezone(pytz.utc)

    jd = datetime_to_julian(utc_dt.replace(tzinfo=None))

    notes = []
    if time_unknown:
        notes.append(
            "Birth time is unknown or approximate. Ascendant, houses, and time-sensitive "
            "positions (especially Moon in some cases) may be inaccurate. "
            "Using 12:00 noon as a placeholder."
        )

    try:
        import swisseph as swe
        return _calculate_with_swisseph(jd, latitude, longitude, dob, local_dt, timezone_str, time_unknown, notes, utc_dt)
    except ImportError:
        logger.warning("pyswisseph not available; using approximate calculation engine")
        return _calculate_approximate(jd, latitude, longitude, dob, local_dt, timezone_str, time_unknown, notes, utc_dt)


def _calculate_with_swisseph(
    jd: float, lat: float, lon: float, dob: date, local_dt: datetime,
    timezone_str: str, time_unknown: bool, notes: list[str], utc_dt: datetime
) -> ChartData:
    """Full calculation using Swiss Ephemeris."""
    import swisseph as swe
    from app.core.config import settings

    # Set ephemeris path if configured
    if settings.ephe_path:
        swe.set_ephe_path(settings.ephe_path)

    # Set Lahiri ayanamsha (sidereal mode 1)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    ayanamsha = swe.get_ayanamsa_ut(jd)

    # Planet mapping: name -> swisseph constant
    PLANET_MAP = {
        "Sun": swe.SUN,
        "Moon": swe.MOON,
        "Mercury": swe.MERCURY,
        "Venus": swe.VENUS,
        "Mars": swe.MARS,
        "Jupiter": swe.JUPITER,
        "Saturn": swe.SATURN,
        "Rahu": swe.MEAN_NODE,   # True node also available
    }

    planets = []
    for name, planet_id in PLANET_MAP.items():
        result, flags = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL | swe.FLG_SPEED)
        lon_sid = result[0] % 360
        speed = result[3]
        retrograde = speed < 0

        pos = _make_planet_position(name, lon_sid, retrograde)
        planets.append(pos)

    # Add Ketu (opposite to Rahu)
    rahu = next(p for p in planets if p.name == "Rahu")
    ketu_lon = (rahu.longitude + 180) % 360
    ketu = _make_planet_position("Ketu", ketu_lon, False)
    planets.append(ketu)

    # Ascendant and Houses
    cusps, ascmc = swe.houses(jd, lat, lon, b'P')  # Placidus
    lagna_tropical = ascmc[0]
    lagna_sidereal = (lagna_tropical - ayanamsha) % 360

    lagna_rashi_idx, lagna_deg = _longitude_to_rashi(lagna_sidereal)
    lagna_rashi = RASHIS[lagna_rashi_idx]

    # Whole Sign Houses (standard in Vedic astrology)
    # House 1 = Lagna rashi, House 2 = next rashi, etc.
    houses = []
    for i in range(12):
        rashi_idx = (lagna_rashi_idx + i) % 12
        cusp_lon = (rashi_idx * 30.0)  # Start of each rashi
        h = HousePosition(
            house_number=i + 1,
            rashi_index=rashi_idx,
            rashi_name=RASHIS[rashi_idx][0],
            longitude=cusp_lon,
        )
        houses.append(h)

    # Moon specifics
    moon = next(p for p in planets if p.name == "Moon")

    # Vimshottari Dasha
    dasha = _calculate_vimshottari(moon.longitude, local_dt)

    return ChartData(
        date_of_birth=dob.isoformat(),
        time_of_birth=local_dt.strftime("%H:%M") if not time_unknown else "Unknown",
        latitude=lat,
        longitude=lon,
        timezone_str=timezone_str,
        time_unknown=time_unknown,
        julian_day=round(jd, 6),
        ayanamsha=round(ayanamsha, 6),
        lagna_longitude=round(lagna_sidereal, 4),
        lagna_rashi_index=lagna_rashi_idx,
        lagna_rashi_name=lagna_rashi[0],
        lagna_rashi_name_kn=lagna_rashi[1],
        lagna_degree=round(lagna_deg, 4),
        planets=planets,
        houses=houses,
        moon_rashi=moon.rashi_name,
        moon_rashi_kn=moon.rashi_name_kn,
        moon_nakshatra=moon.nakshatra_name,
        moon_nakshatra_kn=moon.nakshatra_name_kn,
        moon_pada=moon.pada,
        moon_nakshatra_lord=moon.nakshatra_lord,
        vimshottari_dasha=dasha,
        notes=notes,
    )


def _calculate_approximate(
    jd: float, lat: float, lon: float, dob: date, local_dt: datetime,
    timezone_str: str, time_unknown: bool, notes: list[str], utc_dt: datetime
) -> ChartData:
    """
    Approximate planetary positions when pyswisseph is unavailable.
    
    These are simplified mean-motion calculations — NOT suitable for production.
    They are provided only as a fallback for development/testing.
    Install pyswisseph for accurate results.
    """
    notes.append(
        "⚠ Approximate calculation: pyswisseph is not installed. "
        "Install it for accurate astronomical calculations. "
        "These values are rough approximations using mean motion only."
    )

    # J2000.0 epoch
    J2000 = 2451545.0
    T = (jd - J2000) / 36525.0  # Julian centuries since J2000

    # Mean tropical longitudes (degrees) — simplified VSOP87 first terms
    # These are mean positions, not true positions
    sun_mean = (280.46646 + 36000.76983 * T) % 360
    moon_mean = (218.3165 + 481267.8813 * T) % 360
    mercury_mean = (252.2509 + 149472.6742 * T) % 360
    venus_mean = (181.9798 + 58517.8156 * T) % 360
    mars_mean = (355.433 + 19140.2993 * T) % 360
    jupiter_mean = (34.351 + 3034.9057 * T) % 360
    saturn_mean = (50.077 + 1222.1138 * T) % 360
    rahu_mean = (125.0446 - 1934.1363 * T) % 360  # Mean node (retrograde)

    # Lahiri ayanamsha (approximate: 23.85° at J2000, precessing at ~50.3"/year)
    ayanamsha = (23.85 + (jd - J2000) * (50.3 / 3600) / 365.25) % 360

    def to_sidereal(tropical: float) -> float:
        return (tropical - ayanamsha) % 360

    planet_data = [
        ("Sun", sun_mean, False),
        ("Moon", moon_mean, False),
        ("Mercury", mercury_mean, False),
        ("Venus", venus_mean, False),
        ("Mars", mars_mean, False),
        ("Jupiter", jupiter_mean, False),
        ("Saturn", saturn_mean, False),
        ("Rahu", rahu_mean, True),   # Mean node is always retrograde
    ]

    planets = []
    for name, trop_lon, retro in planet_data:
        sid_lon = to_sidereal(trop_lon)
        pos = _make_planet_position(name, sid_lon, retro)
        planets.append(pos)

    # Ketu opposite Rahu
    rahu = next(p for p in planets if p.name == "Rahu")
    ketu_lon = (rahu.longitude + 180) % 360
    ketu = _make_planet_position("Ketu", ketu_lon, True)
    planets.append(ketu)

    # Approximate Lagna using RAMC + latitude correction
    # This is a very rough approximation
    sidereal_time = (100.4606184 + 36000.77004 * T + lon) % 360
    lagna_tropical = (sidereal_time + 90) % 360  # Very rough
    lagna_sidereal = to_sidereal(lagna_tropical)

    lagna_rashi_idx, lagna_deg = _longitude_to_rashi(lagna_sidereal)
    lagna_rashi = RASHIS[lagna_rashi_idx]

    # Whole Sign Houses
    houses = []
    for i in range(12):
        rashi_idx = (lagna_rashi_idx + i) % 12
        h = HousePosition(
            house_number=i + 1,
            rashi_index=rashi_idx,
            rashi_name=RASHIS[rashi_idx][0],
            longitude=float(rashi_idx * 30),
        )
        houses.append(h)

    moon = next(p for p in planets if p.name == "Moon")
    dasha = _calculate_vimshottari(moon.longitude, local_dt)

    return ChartData(
        date_of_birth=dob.isoformat(),
        time_of_birth=local_dt.strftime("%H:%M") if not time_unknown else "Unknown",
        latitude=lat,
        longitude=lon,
        timezone_str=timezone_str,
        time_unknown=time_unknown,
        julian_day=round(jd, 6),
        ayanamsha=round(ayanamsha, 6),
        lagna_longitude=round(lagna_sidereal, 4),
        lagna_rashi_index=lagna_rashi_idx,
        lagna_rashi_name=lagna_rashi[0],
        lagna_rashi_name_kn=lagna_rashi[1],
        lagna_degree=round(lagna_deg, 4),
        planets=planets,
        houses=houses,
        moon_rashi=moon.rashi_name,
        moon_rashi_kn=moon.rashi_name_kn,
        moon_nakshatra=moon.nakshatra_name,
        moon_nakshatra_kn=moon.nakshatra_name_kn,
        moon_pada=moon.pada,
        moon_nakshatra_lord=moon.nakshatra_lord,
        vimshottari_dasha=dasha,
        notes=notes,
    )
