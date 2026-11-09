from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SymptomLog
from ..schemas import SymptomOut, SymptomUpsert
from ..services.periods import today_limit

router = APIRouter(prefix="/api/symptoms", tags=["symptoms"])


@router.get("", response_model=list[SymptomOut])
def list_symptoms(
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    """Daily logs, newest first. Optionally limited to a date range."""
    stmt = select(SymptomLog).order_by(SymptomLog.log_date.desc())
    if start:
        stmt = stmt.where(SymptomLog.log_date >= start)
    if end:
        stmt = stmt.where(SymptomLog.log_date <= end)
    return db.scalars(stmt).all()


@router.put("", response_model=SymptomOut)
def upsert_symptom(payload: SymptomUpsert, db: Session = Depends(get_db)):
    """Create the log for a day, or update it if that day already has one."""
    if payload.log_date > today_limit():
        raise HTTPException(422, "You can't log symptoms for a future date.")
    existing = db.scalar(select(SymptomLog).where(SymptomLog.log_date == payload.log_date))
    if existing:
        for key, value in payload.model_dump().items():
            setattr(existing, key, value)
        row = existing
    else:
        row = SymptomLog(**payload.model_dump())
        db.add(row)
    db.commit()
    return row


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_symptom(log_id: int, db: Session = Depends(get_db)):
    row = db.get(SymptomLog, log_id)
    if not row:
        raise HTTPException(404, "Log not found.")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
