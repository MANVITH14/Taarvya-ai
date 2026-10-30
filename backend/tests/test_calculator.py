"""
Unit tests for the Vedic Astrology Calculation Engine.
"""
from datetime import date, time
import pytest

from app.astrology.calculator import (
    calculate_chart,
    ChartData,
    NAKSHATRAS,
    RASHIS,
    VIMSHOTTARI_ORDER,
    VIMSHOTTARI_YEARS,
    TOTAL_DASHA_YEARS,
)


def test_constants():
    """Verify standard astronomical constants."""
    assert len(NAKSHATRAS) == 27
    assert len(RASHIS) == 12
    assert len(VIMSHOTTARI_ORDER) == 9
    assert sum(VIMSHOTTARI_YEARS.values()) == TOTAL_DASHA_YEARS
    assert TOTAL_DASHA_YEARS == 120


def test_calculate_chart_known_time():
    """Test chart calculation with exact birth time."""
    dob = date(1995, 8, 15)
    tob = time(14, 30, 0)
    # Bangalore coordinates
    lat = 12.9716
    lon = 77.5946
    tz_str = "Asia/Kolkata"

    chart = calculate_chart(
        dob=dob,
        tob=tob,
        latitude=lat,
        longitude=lon,
        timezone_str=tz_str,
        time_unknown=False,
    )

    assert isinstance(chart, ChartData)
    assert chart.date_of_birth == "1995-08-15"
    assert chart.time_of_birth == "14:30"
    assert not chart.time_unknown
    assert len(chart.planets) == 9
    assert len(chart.houses) == 12
    assert len(chart.vimshottari_dasha) > 0

    # Verify planetary position properties
    planet_names = {p.name for p in chart.planets}
    assert "Sun" in planet_names
    assert "Moon" in planet_names
    assert "Rahu" in planet_names
    assert "Ketu" in planet_names

    # Check lagna and moon properties
    assert chart.lagna_rashi_name in [r[0] for r in RASHIS]
    assert chart.moon_rashi in [r[0] for r in RASHIS]
    assert chart.moon_nakshatra in [n[0] for n in NAKSHATRAS]
    assert 1 <= chart.moon_pada <= 4

    # Verify whole sign houses start from 1 to 12
    assert [h.house_number for h in chart.houses] == list(range(1, 13))


def test_calculate_chart_unknown_time():
    """Test chart calculation when time of birth is unknown."""
    dob = date(2000, 1, 1)
    lat = 28.6139
    lon = 77.2090
    tz_str = "Asia/Kolkata"

    chart = calculate_chart(
        dob=dob,
        tob=None,
        latitude=lat,
        longitude=lon,
        timezone_str=tz_str,
        time_unknown=True,
    )

    assert chart.time_unknown
    assert any("unknown or approximate" in note.lower() for note in chart.notes)
    assert len(chart.planets) == 9


def test_chart_to_dict():
    """Test serialization of ChartData to dictionary."""
    dob = date(1990, 5, 20)
    tob = time(9, 15)
    chart = calculate_chart(
        dob=dob,
        tob=tob,
        latitude=13.0827,
        longitude=80.2707,
        timezone_str="Asia/Kolkata",
    )

    chart_dict = chart.to_dict()
    assert isinstance(chart_dict, dict)
    assert "planets" in chart_dict
    assert "houses" in chart_dict
    assert "vimshottari_dasha" in chart_dict
    assert chart_dict["date_of_birth"] == "1990-05-20"
