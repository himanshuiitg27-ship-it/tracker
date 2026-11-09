from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Period
from ..schemas import PeriodCreate, PeriodOut, PeriodUpdate
from ..services.periods import annotate, validate_period

router = APIRouter(prefix="/api/periods", tags=["periods"])


def _all_annotated(db: Session) -> list[PeriodOut]:
    rows = list(db.scalars(select(Period).order_by(Period.start_date.asc())).all())
    return annotate(rows)


def _one(db: Session, period_id: int) -> PeriodOut:
    for item in _all_annotated(db):
        if item.id == period_id:
            return item
    raise HTTPException(404, "Period not found.")


@router.get("", response_model=list[PeriodOut])
def list_periods(db: Session = Depends(get_db)):
    """All saved periods, oldest first."""
    return _all_annotated(db)


@router.get("/{period_id}", response_model=PeriodOut)
def get_period(period_id: int, db: Session = Depends(get_db)):
    return _one(db, period_id)


@router.post("", response_model=PeriodOut, status_code=status.HTTP_201_CREATED)
def create_period(payload: PeriodCreate, db: Session = Depends(get_db)):
    validate_period(db, payload.start_date, payload.end_date)
    period = Period(**payload.model_dump())
    db.add(period)
    try:
        db.commit()
    except IntegrityError:  # race condition safety net (unique constraint)
        db.rollback()
        raise HTTPException(409, "A period with this start date is already recorded.")
    return _one(db, period.id)


@router.put("/{period_id}", response_model=PeriodOut)
def update_period(period_id: int, payload: PeriodUpdate, db: Session = Depends(get_db)):
    period = db.get(Period, period_id)
    if not period:
        raise HTTPException(404, "Period not found.")
    validate_period(db, payload.start_date, payload.end_date, exclude_id=period_id)
    period.start_date = payload.start_date
    period.end_date = payload.end_date
    period.notes = payload.notes
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "A period with this start date is already recorded.")
    return _one(db, period_id)


@router.delete("/{period_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_period(period_id: int, db: Session = Depends(get_db)):
    period = db.get(Period, period_id)
    if not period:
        raise HTTPException(404, "Period not found.")
    db.delete(period)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
