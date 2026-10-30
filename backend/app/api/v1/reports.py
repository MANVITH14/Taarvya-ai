"""Reports API endpoints — generation, saving, listing, export, and PDF preview."""
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.birth_profile import BirthProfile, SavedReport
from app.astrology.calculator import calculate_chart
from app.services.ai_reports import generate_report

router = APIRouter()


class GenerateReportRequest(BaseModel):
    profile_id: str
    report_type: str
    language: str = "en"


class SaveReportRequest(BaseModel):
    profile_id: str
    report_type: str
    language: str = "en"
    content: Dict[str, Any]


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


@router.post("/generate")
async def generate_chart_report(
    payload: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI interpretation report for a birth chart."""
    profile = await _get_profile_owned(payload.profile_id, current_user, db)

    # Use cached chart or calculate
    chart_data = profile.cached_chart
    if not chart_data:
        chart_result = calculate_chart(
            name=profile.name,
            date_of_birth=profile.date_of_birth,
            time_of_birth=profile.time_of_birth,
            latitude=profile.latitude,
            longitude=profile.longitude,
            timezone_str=profile.timezone_str,
            time_unknown=profile.time_unknown,
        )
        chart_data = chart_result.to_dict()
        profile.cached_chart = chart_data
        profile.chart_calculated_at = datetime.now(timezone.utc)
        await db.commit()

    try:
        report = await generate_report(
            chart_data=chart_data,
            report_type=payload.report_type,
            language=payload.language,
            person_name=profile.name,
        )
        return report
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.post("/save", status_code=status.HTTP_201_CREATED)
async def save_report(
    payload: SaveReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a generated report to user's account."""
    profile = await _get_profile_owned(payload.profile_id, current_user, db)

    is_ai = bool(payload.content.get("ai_generated", False))

    saved = SavedReport(
        user_id=current_user.id,
        birth_profile_id=profile.id,
        report_type=payload.report_type,
        language=payload.language,
        content=payload.content,
        ai_generated=is_ai,
    )
    db.add(saved)
    await db.commit()
    await db.refresh(saved)

    return {
        "id": str(saved.id),
        "birth_profile_id": str(saved.birth_profile_id),
        "report_type": saved.report_type,
        "language": saved.language,
        "content": saved.content,
        "ai_generated": saved.ai_generated,
        "created_at": saved.created_at.isoformat() if saved.created_at else None,
    }


@router.get("")
async def list_saved_reports(
    profile_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List saved reports for current user, optionally filtered by profile."""
    stmt = select(SavedReport).where(SavedReport.user_id == current_user.id)
    if profile_id:
        try:
            pid = uuid.UUID(profile_id)
            stmt = stmt.where(SavedReport.birth_profile_id == pid)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid profile ID")

    stmt = stmt.order_by(SavedReport.created_at.desc())
    result = await db.execute(stmt)
    reports = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "birth_profile_id": str(r.birth_profile_id),
            "report_type": r.report_type,
            "language": r.language,
            "content": r.content,
            "ai_generated": r.ai_generated,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@router.get("/export")
async def export_user_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export complete user data (profiles, charts, reports) as JSON download."""
    # Fetch profiles
    p_result = await db.execute(
        select(BirthProfile).where(BirthProfile.user_id == current_user.id)
    )
    profiles = p_result.scalars().all()

    # Fetch reports
    r_result = await db.execute(
        select(SavedReport).where(SavedReport.user_id == current_user.id)
    )
    reports = r_result.scalars().all()

    data = {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "preferred_language": current_user.preferred_language,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        },
        "profiles": [
            {
                "id": str(p.id),
                "name": p.name,
                "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
                "time_of_birth": p.time_of_birth.isoformat() if p.time_of_birth else None,
                "time_unknown": p.time_unknown,
                "birthplace_name": p.birthplace_name,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "timezone_str": p.timezone_str,
                "gender": p.gender,
                "cached_chart": p.cached_chart,
            }
            for p in profiles
        ],
        "saved_reports": [
            {
                "id": str(r.id),
                "birth_profile_id": str(r.birth_profile_id),
                "report_type": r.report_type,
                "language": r.language,
                "content": r.content,
                "ai_generated": r.ai_generated,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ],
    }

    content_str = json.dumps(data, indent=2, ensure_ascii=False)
    filename = f"taarvya-export-{current_user.id}.json"
    return Response(
        content=content_str,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{report_id}")
async def get_saved_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific saved report."""
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    result = await db.execute(select(SavedReport).where(SavedReport.id == rid))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "id": str(report.id),
        "birth_profile_id": str(report.birth_profile_id),
        "report_type": report.report_type,
        "language": report.language,
        "content": report.content,
        "ai_generated": report.ai_generated,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a saved report."""
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    result = await db.execute(select(SavedReport).where(SavedReport.id == rid))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.delete(report)
    await db.commit()
    return None


@router.get("/{report_id}/pdf")
async def download_report_pdf(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate an elegant printable HTML/PDF document for a saved report.
    Users can print or save as PDF directly from the browser with standard print styling.
    """
    try:
        rid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report ID")

    result = await db.execute(select(SavedReport).where(SavedReport.id == rid))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch associated birth profile
    p_result = await db.execute(select(BirthProfile).where(BirthProfile.id == report.birth_profile_id))
    profile = p_result.scalar_one_or_none()
    profile_name = profile.name if profile else "Client"

    content = report.content or {}
    title = content.get("title", f"Vedic Astrology Report ({report.report_type})")
    summary = content.get("summary", "")
    sections = content.get("sections", [])
    disclaimer = content.get("disclaimer", "")

    sections_html = ""
    for sec in sections:
        heading = sec.get("heading", "")
        text = sec.get("content", "").replace("\n", "<br/>")
        sections_html += f"""
        <div class="section">
            <h2>{heading}</h2>
            <p>{text}</p>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="{report.language}">
<head>
    <meta charset="UTF-8">
    <title>{title} - Taarvya AI</title>
    <style>
        @page {{ size: A4; margin: 20mm; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #FAF8F5;
            color: #2D1A30;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
        }}
        .header {{
            border-bottom: 2px solid #845EC2;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .brand {{
            font-size: 24px;
            font-weight: bold;
            color: #4B2054;
            letter-spacing: 1px;
        }}
        .tagline {{
            font-size: 12px;
            color: #845EC2;
            margin-top: 4px;
        }}
        .report-title {{
            font-size: 26px;
            color: #2D1A30;
            margin-bottom: 8px;
        }}
        .meta-box {{
            background: #FFFFFF;
            border: 1px solid #E5DDF0;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 25px;
            display: flex;
            gap: 20px;
            font-size: 14px;
        }}
        .meta-item strong {{ color: #4B2054; }}
        .summary {{
            background: #F3EEF9;
            border-left: 4px solid #845EC2;
            padding: 16px 20px;
            border-radius: 4px;
            font-size: 15px;
            margin-bottom: 30px;
        }}
        .section {{
            background: #FFFFFF;
            border: 1px solid #EDE8F5;
            border-radius: 8px;
            padding: 20px 24px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }}
        .section h2 {{
            color: #4B2054;
            font-size: 18px;
            margin-top: 0;
            margin-bottom: 12px;
            border-bottom: 1px solid #F3EEF9;
            padding-bottom: 8px;
        }}
        .section p {{
            margin: 0;
            color: #423547;
            white-space: pre-line;
        }}
        .disclaimer {{
            margin-top: 40px;
            padding: 16px;
            background: #FFF9E6;
            border: 1px solid #FFE082;
            border-radius: 6px;
            font-size: 12px;
            color: #795548;
            page-break-inside: avoid;
        }}
        .print-btn {{
            position: fixed;
            top: 20px;
            right: 20px;
            background: #845EC2;
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
        }}
        @media print {{
            .print-btn {{ display: none; }}
            body {{ padding: 0; background: white; }}
        }}
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <div class="header">
        <div>
            <div class="brand">TAARVYA AI</div>
            <div class="tagline">Your Birth Chart. Your Cosmic Story.</div>
        </div>
        <div style="text-align: right; font-size: 13px; color: #666;">
            Generated: {datetime.now().strftime("%d %b %Y")}
        </div>
    </div>

    <h1 class="report-title">{title}</h1>
    
    <div class="meta-box">
        <div class="meta-item"><strong>Profile:</strong> {profile_name}</div>
        <div class="meta-item"><strong>Type:</strong> {report.report_type.title()}</div>
        <div class="meta-item"><strong>Language:</strong> {'Kannada' if report.language == 'kn' else 'English'}</div>
    </div>

    {f'<div class="summary"><strong>Summary:</strong> {summary}</div>' if summary else ''}

    {sections_html}

    <div class="disclaimer">
        <strong>Vedic Astrology Disclaimer:</strong><br/>
        {disclaimer or 'This report is prepared for cultural and self-reflection purposes based on traditional Vedic calculations. Planetary placements do not determine fate or replace professional advice.'}
    </div>
</body>
</html>
"""
    return Response(content=html, media_type="text/html")
