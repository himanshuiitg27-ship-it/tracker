"""Validation + helpers for period records."""
from datetime import date, timedelta
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Period
from ..schemas import PeriodOut

settings = get_settings()


def today_limit() -> date:
    # One day of slack so users ahead of the server's (UTC) clock can log "today".
    return date.today() + timedelta(days=1)


def validate_period(
    db: Session, start: date, end: Optional[date], exclude_id: Optional[int] = None
) -> None:
    """Raise HTTPException(422/409) if the dates are invalid or clash with existing data."""
    limit = today_limit()
    if start > limit:
        raise HTTPException(422, "Start date cannot be in the future.")
    if end is not None:
        if end < start:
            raise HTTPException(422, "End date cannot be before the start date.")
        if end > limit:
            raise HTTPException(422, "End date cannot be in the future.")
        length = (end - start).days + 1
        if length > settings.max_period_length:
            raise HTTPException(
                422,
                f"A period longer than {settings.max_period_length} days looks unusual - "
                "please double-check the dates.",
            )

    stmt = select(Period)
    if exclude_id is not None:
        stmt = stmt.where(Period.id != exclude_id)
    others = db.scalars(stmt).all()

    for p in others:
        if p.start_date == start:
            raise HTTPException(409, f"A period starting on {start.isoformat()} is already recorded.")

    new_end = end or start
    for p in others:
        p_end = p.end_date or p.start_date
        if start <= p_end and p.start_date <= new_end:
            raise HTTPException(
                409,
                f"These dates overlap an existing period "
                f"({p.start_date.isoformat()} - {(p.end_date or p.start_date).isoformat()}).",
            )
        if p.end_date is None and p.start_date < start:
            raise HTTPException(
                409,
                f"Your period that started on {p.start_date.isoformat()} has no end date yet. "
                "Please add its end date first.",
            )
        if end is None and p.start_date > start:
            raise HTTPException(
                422, "Only your most recent period can be ongoing. Please add an end date."
            )


def annotate(periods_asc: list[Period]) -> list[PeriodOut]:
    """Convert ORM rows (sorted by start asc) to API objects with derived fields."""
    out: list[PeriodOut] = []
    prev: Optional[Period] = None
    for p in periods_asc:
        item = PeriodOut.model_validate(p)
        item.is_ongoing = p.end_date is None
        item.duration_days = (p.end_date - p.start_date).days + 1 if p.end_date else None
        item.cycle_length = (p.start_date - prev.start_date).days if prev else None
        out.append(item)
        prev = p
    return out
