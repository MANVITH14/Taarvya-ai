"""
Unit and integration tests for Taarvya AI API and services.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.auth import hash_password, verify_password, create_access_token
from app.services.ai_reports import generate_report, DISCLAIMER, DISCLAIMER_KN
from app.astrology.calculator import calculate_chart
from datetime import date, time

client = TestClient(app)


def test_health_check():
    """Verify health check endpoint returns 200 OK and expected structure."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data


def test_root_endpoint():
    """Verify root endpoint returns API message and docs link."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Taarvya AI" in data["message"]
    assert data["docs"] == "/docs"


def test_password_hashing():
    """Verify password hashing with Argon2 generates unique hashes and verifies correctly."""
    pwd = "CosmicSecret@2025"
    hashed = hash_password(pwd)

    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_token_creation():
    """Verify JWT access token generation."""
    user_id = "11111111-2222-3333-4444-555555555555"
    email = "test@taarvya.ai"
    token = create_access_token(user_id=user_id, email=email)
    assert isinstance(token, str)
    assert len(token) > 20


@pytest.mark.asyncio
async def test_ai_report_fallback_en():
    """Verify fallback report generation in English when AI key is absent."""
    chart = calculate_chart(
        dob=date(1992, 11, 4),
        tob=time(6, 45),
        latitude=12.9716,
        longitude=77.5946,
        timezone_str="Asia/Kolkata",
    )
    chart_data = chart.to_dict()

    report = await generate_report(
        chart_data=chart_data,
        report_type="personality",
        language="en",
        person_name="Ananya",
    )

    assert report["language"] == "en"
    assert report["report_type"] == "personality"
    assert "Ananya" in report["title"]
    assert len(report["sections"]) >= 2
    assert report["disclaimer"] == DISCLAIMER
    assert report["ai_generated"] is False


@pytest.mark.asyncio
async def test_ai_report_fallback_kn():
    """Verify fallback report generation in Kannada when language='kn'."""
    chart = calculate_chart(
        dob=date(1992, 11, 4),
        tob=time(6, 45),
        latitude=12.9716,
        longitude=77.5946,
        timezone_str="Asia/Kolkata",
    )
    chart_data = chart.to_dict()

    report = await generate_report(
        chart_data=chart_data,
        report_type="career",
        language="kn",
        person_name="ಅರ್ಜುನ್",
    )

    assert report["language"] == "kn"
    assert report["report_type"] == "career"
    assert "ವರದಿ" in report["title"]
    assert report["disclaimer"] == DISCLAIMER_KN
    assert report["ai_generated"] is False
