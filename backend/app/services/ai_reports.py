"""
AI interpretation service using OpenAI API.
Called only from the backend — API key never exposed to frontend.

If OpenAI is unavailable, returns chart-data-based fallback text.
All interpretations are clearly labeled as traditional/cultural perspectives.
"""
from __future__ import annotations

import json
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "These interpretations are based on traditional Vedic astrology principles "
    "for entertainment and personal reflection only. They do not constitute "
    "medical, financial, legal, or life advice. Astronomical positions are "
    "calculated from ephemeris data; the interpretive meanings are cultural "
    "and symbolic in nature. Planetary placements cannot guarantee outcomes."
)

DISCLAIMER_KN = (
    "ಈ ವ್ಯಾಖ್ಯಾನಗಳು ಸಾಂಪ್ರದಾಯಿಕ ವೈದಿಕ ಜ್ಯೋತಿಷ್ಯ ತತ್ವಗಳ ಮೇಲೆ ಆಧಾರಿತವಾಗಿವೆ, "
    "ಇದು ಮನರಂಜನೆ ಮತ್ತು ವೈಯಕ್ತಿಕ ಪ್ರತಿಬಿಂಬಕ್ಕಾಗಿ ಮಾತ್ರ. ಇವು ವೈದ್ಯಕೀಯ, ಆರ್ಥಿಕ, "
    "ಕಾನೂನು ಅಥವಾ ಜೀವನ ಸಲಹೆಯನ್ನು ರಚಿಸುವುದಿಲ್ಲ."
)

REPORT_TYPES = ["personality", "relationships", "career", "finances", "education", "family", "yearly"]


def _build_chart_summary(chart_data: dict) -> str:
    """Create a concise text summary of chart data for the AI prompt."""
    lines = [
        f"Birth Date: {chart_data.get('date_of_birth')}",
        f"Birth Time: {chart_data.get('time_of_birth')} (unknown: {chart_data.get('time_unknown', False)})",
        f"Lagna (Ascendant): {chart_data.get('lagna_rashi_name')} ({chart_data.get('lagna_degree', 0):.1f}° in rashi)",
        f"Moon Sign (Rashi): {chart_data.get('moon_rashi')}",
        f"Moon Nakshatra: {chart_data.get('moon_nakshatra')} Pada {chart_data.get('moon_pada')}",
        "",
        "Planetary Positions:",
    ]
    
    for planet in chart_data.get("planets", []):
        retro = " (R)" if planet.get("retrograde") else ""
        lines.append(
            f"  {planet['name']}: {planet['rashi_name']} {planet['degree_in_rashi']:.1f}° "
            f"in House {_get_house_for_planet(planet, chart_data)}{retro}"
        )
    
    current_dasha = next(
        (d for d in chart_data.get("vimshottari_dasha", []) if d.get("is_current")),
        None
    )
    if current_dasha:
        lines.append(f"\nCurrent Mahadasha: {current_dasha['planet']} ({current_dasha['start']} to {current_dasha['end']})")
    
    return "\n".join(lines)


def _get_house_for_planet(planet: dict, chart_data: dict) -> int:
    """Determine which house a planet occupies (whole sign)."""
    lagna_rashi = chart_data.get("lagna_rashi_index", 0)
    planet_rashi = planet.get("rashi_index", 0)
    house = ((planet_rashi - lagna_rashi) % 12) + 1
    return house


async def generate_report(
    chart_data: dict,
    report_type: str,
    language: str = "en",
    person_name: str = "",
) -> dict:
    """
    Generate an AI interpretation report for a given chart and report type.
    
    Returns a dict with report sections, or a fallback if AI is unavailable.
    """
    if report_type not in REPORT_TYPES:
        raise ValueError(f"Unknown report type: {report_type}")

    if not settings.ai_available:
        return _fallback_report(chart_data, report_type, language, person_name)

    try:
        return await _openai_report(chart_data, report_type, language, person_name)
    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        fallback = _fallback_report(chart_data, report_type, language, person_name)
        fallback["ai_error"] = f"AI service temporarily unavailable: {str(e)[:100]}"
        return fallback


async def _openai_report(
    chart_data: dict, report_type: str, language: str, person_name: str
) -> dict:
    """Generate report using OpenAI."""
    from openai import AsyncOpenAI
    
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    lang_instruction = (
        "Respond entirely in Kannada (ಕನ್ನಡ) using Kannada script."
        if language == "kn"
        else "Respond entirely in clear, simple English."
    )

    chart_summary = _build_chart_summary(chart_data)
    name_ref = f"for {person_name}" if person_name else ""
    
    system_prompt = f"""You are a knowledgeable Vedic astrology guide providing traditional interpretations.
{lang_instruction}

IMPORTANT RULES:
- Base all interpretations ONLY on the chart data provided below
- Label all predictions as "traditional interpretation" or "according to Vedic tradition"
- Never guarantee outcomes, dates, marriage timing, wealth, or health outcomes
- Never recommend medical treatments or financial investments
- Present astrology as cultural wisdom and a tool for self-reflection
- If a placement is neutral, say so — do not invent drama
- Keep language accessible, warm, and encouraging
- Structure your response as valid JSON matching the schema provided

Chart Data {name_ref}:
{chart_summary}"""

    report_prompts = {
        "personality": "Describe the person's personality traits, strengths, and growth areas based on their Lagna, Moon sign, and Sun sign. Focus on character, not fate.",
        "relationships": "Describe relationship patterns and compatibility tendencies based on the 7th house, Venus, and Moon. Avoid guaranteeing marriage or specific relationships.",
        "career": "Describe career aptitudes and work style based on the 10th house lord, Sun, and Saturn placements.",
        "finances": "Describe financial tendencies based on the 2nd and 11th house lords and Jupiter's placement.",
        "education": "Describe learning style and intellectual strengths based on Mercury, Jupiter, and the 4th/5th houses.",
        "family": "Describe family dynamics and home environment based on the 4th house and Moon.",
        "yearly": "Provide a broad thematic outlook for the current Mahadasha period based on the ruling planet's nature and placements.",
    }

    schema = {
        "title": "string - report section title",
        "summary": "string - 2-3 sentence overview",
        "sections": [
            {"heading": "string", "content": "string - 2-4 paragraphs"}
        ],
        "key_themes": ["string - 3-5 key themes"],
        "disclaimer": "string",
    }

    user_message = f"""Generate a Vedic astrology {report_type} interpretation report.

{report_prompts.get(report_type, "")}

Return ONLY valid JSON matching this schema:
{json.dumps(schema, indent=2)}

Replace placeholder values with actual content based on the chart data."""

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=2000,
    )

    content = response.choices[0].message.content
    report = json.loads(content)
    report["ai_generated"] = True
    report["language"] = language
    report["report_type"] = report_type
    report["disclaimer"] = DISCLAIMER if language == "en" else DISCLAIMER_KN
    
    return report


def _fallback_report(
    chart_data: dict, report_type: str, language: str, person_name: str
) -> dict:
    """
    Generate a basic chart-data-based report without AI.
    Returns factual chart information with traditional keyword associations.
    """
    moon_rashi = chart_data.get("moon_rashi", "Unknown")
    lagna_rashi = chart_data.get("lagna_rashi_name", "Unknown")
    moon_nak = chart_data.get("moon_nakshatra", "Unknown")
    moon_pada = chart_data.get("moon_pada", 0)

    is_kn = language == "kn"
    
    name_ref = f"{person_name}'s " if person_name else ""

    # Rashi keyword associations (simplified traditional)
    RASHI_KEYWORDS = {
        "Mesha": ("dynamic, pioneering, courageous", "ಕ್ರಿಯಾಶೀಲ, ಮುಂಚೂಣಿ, ಧೈರ್ಯಶಾಲಿ"),
        "Vrishabha": ("patient, artistic, determined", "ತಾಳ್ಮೆಯ, ಕಲಾತ್ಮಕ, ಕಟಿಬದ್ಧ"),
        "Mithuna": ("curious, communicative, adaptable", "ಕುತೂಹಲಿ, ಸಂವಹನಶೀಲ, ಹೊಂದಿಕೊಳ್ಳುವ"),
        "Karka": ("nurturing, intuitive, protective", "ಪೋಷಣೀಯ, ಅಂತಃಪ್ರಜ್ಞಾಶಾಲಿ, ರಕ್ಷಣಾತ್ಮಕ"),
        "Simha": ("confident, generous, creative", "ಆತ್ಮವಿಶ್ವಾಸಿ, ಉದಾರ, ಸೃಜನಶೀಲ"),
        "Kanya": ("analytical, helpful, detail-oriented", "ವಿಶ್ಲೇಷಣಾತ್ಮಕ, ಸಹಾಯಕ, ವಿವರ-ಆಧಾರಿತ"),
        "Tula": ("balanced, diplomatic, aesthetic", "ಸಂತುಲಿತ, ರಾಜತಾಂತ್ರಿಕ, ಸೌಂದರ್ಯಾಸಕ್ತ"),
        "Vrischika": ("intense, perceptive, transformative", "ತೀವ್ರ, ಗ್ರಹಣಶಕ್ತಿ, ರೂಪಾಂತರಕಾರಿ"),
        "Dhanu": ("optimistic, philosophical, adventurous", "ಆಶಾವಾದಿ, ತಾತ್ವಿಕ, ಸಾಹಸಿ"),
        "Makara": ("disciplined, ambitious, practical", "ಶಿಸ್ತಿನ, ಮಹತ್ವಾಕಾಂಕ್ಷಿ, ಪ್ರಾಯೋಗಿಕ"),
        "Kumbha": ("innovative, humanitarian, independent", "ನಾವೀನ್ಯಪೂರ್ಣ, ಮಾನವೀಯ, ಸ್ವತಂತ್ರ"),
        "Meena": ("compassionate, spiritual, imaginative", "ಸಹಾನುಭೂತಿ, ಆಧ್ಯಾತ್ಮಿಕ, ಕಲ್ಪನಾಶಕ್ತಿ"),
    }

    moon_kw_en, moon_kw_kn = RASHI_KEYWORDS.get(moon_rashi, ("thoughtful", "ಚಿಂತನಶೀಲ"))
    lagna_kw_en, lagna_kw_kn = RASHI_KEYWORDS.get(lagna_rashi, ("versatile", "ಬಹುಮುಖ"))

    if is_kn:
        title = f"{name_ref}ಜ್ಯೋತಿಷ್ಯ {_report_type_kn(report_type)} ವರದಿ"
        summary = (
            f"ಲಗ್ನ (ಆಸ್ಟಿನ್ ಲಗ್ನ) {lagna_rashi} ರಾಶಿಯಲ್ಲಿದ್ದು, {lagna_kw_kn} ಗುಣಗಳನ್ನು ಸೂಚಿಸುತ್ತದೆ. "
            f"ಚಂದ್ರ {moon_rashi} ರಾಶಿಯಲ್ಲಿ {moon_nak} ನಕ್ಷತ್ರದ {moon_pada}ನೇ ಪಾದದಲ್ಲಿದ್ದು, "
            f"{moon_kw_kn} ಭಾವನಾತ್ಮಕ ಸ್ವಭಾವವನ್ನು ಸೂಚಿಸುತ್ತದೆ."
        )
        ai_note = "ಸ್ವಯಂಚಾಲಿತ AI ವ್ಯಾಖ್ಯಾನ ಸದ್ಯಕ್ಕೆ ಲಭ್ಯವಿಲ್ಲ. ಗ್ರಹ ಡೇಟಾ ಮಾತ್ರ ತೋರಿಸಲಾಗಿದೆ."
    else:
        title = f"{name_ref}Vedic Astrology {report_type.title()} Report"
        summary = (
            f"Your Ascendant (Lagna) is in {lagna_rashi}, suggesting a {lagna_kw_en} disposition. "
            f"Your Moon is in {moon_rashi} in the {moon_nak} Nakshatra (Pada {moon_pada}), "
            f"indicating a {moon_kw_en} emotional nature."
        )
        ai_note = "AI interpretation is not currently available. Chart data shown below."

    sections = [
        {
            "heading": "Chart Overview" if not is_kn else "ಕುಂಡಲಿ ಅವಲೋಕನ",
            "content": summary,
        },
        {
            "heading": "Planetary Positions" if not is_kn else "ಗ್ರಹ ಸ್ಥಾನಗಳು",
            "content": ai_note + "\n\n" + _format_planets_text(chart_data, is_kn),
        }
    ]

    return {
        "title": title,
        "summary": summary,
        "sections": sections,
        "key_themes": [lagna_kw_en if not is_kn else lagna_kw_kn],
        "disclaimer": DISCLAIMER if not is_kn else DISCLAIMER_KN,
        "ai_generated": False,
        "language": language,
        "report_type": report_type,
    }


def _report_type_kn(rt: str) -> str:
    mapping = {
        "personality": "ವ್ಯಕ್ತಿತ್ವ",
        "relationships": "ಸಂಬಂಧ",
        "career": "ವೃತ್ತಿ",
        "finances": "ಹಣಕಾಸು",
        "education": "ಶಿಕ್ಷಣ",
        "family": "ಕುಟುಂಬ",
        "yearly": "ವಾರ್ಷಿಕ",
    }
    return mapping.get(rt, rt)


def _format_planets_text(chart_data: dict, is_kn: bool) -> str:
    lines = []
    for p in chart_data.get("planets", []):
        retro = " (R)" if p.get("retrograde") else ""
        if is_kn:
            lines.append(f"{p['name']}: {p.get('rashi_name_kn', p['rashi_name'])} ರಾಶಿ{retro}")
        else:
            lines.append(f"{p['name']}: {p['rashi_name']} {p['degree_in_rashi']:.1f}°{retro}")
    return "\n".join(lines)
