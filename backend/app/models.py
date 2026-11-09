from datetime import date, datetime, timezone

from sqlalchemy import CheckConstraint, Date, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Period(Base):
    """One menstrual period. end_date is NULL while the period is ongoing."""

    __tablename__ = "periods"
    __table_args__ = (
        UniqueConstraint("start_date", name="uq_periods_start_date"),
        CheckConstraint("end_date IS NULL OR end_date >= start_date", name="ck_periods_end_after_start"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class SymptomLog(Base):
    """Daily mood / symptom log. One row per calendar day."""

    __tablename__ = "symptom_logs"
    __table_args__ = (
        UniqueConstraint("log_date", name="uq_symptom_logs_log_date"),
        CheckConstraint("cramps BETWEEN 0 AND 5", name="ck_symptom_cramps"),
        CheckConstraint("energy BETWEEN 1 AND 5", name="ck_symptom_energy"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    cramps: Mapped[int] = mapped_column(Integer, default=0)  # 0 none .. 5 severe
    energy: Mapped[int] = mapped_column(Integer, default=3)  # 1 very low .. 5 high
    mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    flow: Mapped[str | None] = mapped_column(String(16), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
