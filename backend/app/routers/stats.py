from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import Stats
from ..services.stats import compute_stats

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=Stats)
def get_stats(
    today: Optional[date] = Query(None, description="Client's local date (defaults to server date)"),
    db: Session = Depends(get_db),
):
    return compute_stats(db, today)
