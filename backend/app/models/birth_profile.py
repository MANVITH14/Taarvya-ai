"""
SQLAlchemy BirthProfile and SavedReport models.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, time
from typing import Optional, List, Dict, Any

from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey, 
    Integer, String, Text, Time, Uuid, JSON, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BirthProfile(Base):
    __tablename__ = "birth_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    time_of_birth: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    time_unknown: Mapped[bool] = mapped_column(Boolean, default=False)
    birthplace_name: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timezone_str: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    cached_chart: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    chart_calculated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="birth_profiles")
    saved_reports: Mapped[List["SavedReport"]] = relationship(
        "SavedReport", back_populates="birth_profile", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<BirthProfile id={self.id} name={self.name}>"


class SavedReport(Base):
    __tablename__ = "saved_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    birth_profile_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("birth_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)  # personality, career, etc.
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="saved_reports")
    birth_profile: Mapped["BirthProfile"] = relationship("BirthProfile", back_populates="saved_reports")

    def __repr__(self) -> str:
        return f"<SavedReport id={self.id} type={self.report_type}>"
