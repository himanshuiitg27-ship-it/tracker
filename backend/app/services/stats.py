"""Cycle statistics and predictions derived from recorded periods."""
from datetime import date, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Period
from ..schemas import PredictedPeriod, Stats

settings = get_settings()
RECENT_CYCLES = 6  # predictions weigh the most recent cycles


def compute_stats(db: Session, today: Optional[date] = None) -> Stats:
    today = today or date.today()
    periods = list(db.scalars(select(Period).order_by(Period.start_date.asc())).all())

    # Cycle length = days between consecutive period start dates.
    cycles: list[dict] = []
    for prev, cur in zip(periods, periods[1:]):
        cycles.append(
            {
                "start_date": cur.start_date,
                "cycle_length": (cur.start_date - prev.start_date).days,
                "period_length": (cur.end_date - cur.start_date).days + 1 if cur.end_date else None,
            }
        )
    lengths = [c["cycle_length"] for c in cycles]
    recent = lengths[-RECENT_CYCLES:]

    avg_cycle = round(sum(recent) / len(recent)) if recent else None
    period_lens = [(p.end_date - p.start_date).days + 1 for p in periods if p.end_date]
    avg_period = round(sum(period_lens) / len(period_lens)) if period_lens else None

    base_cycle = avg_cycle or settings.default_cycle_length
    base_period = avg_period or settings.default_period_length

    last = periods[-1] if periods else None
    next_start = cycle_day = ovulation = phase = days_until = None
    predictions: list[PredictedPeriod] = []

    if last:
        next_start = last.start_date + timedelta(days=base_cycle)
        days_until = (next_start - today).days
        cycle_day = (today - last.start_date).days + 1
        ovulation = next_start - timedelta(days=14)
        for k in range(1, 4):
            s = last.start_date + timedelta(days=base_cycle * k)
            predictions.append(PredictedPeriod(start_date=s, end_date=s + timedelta(days=base_period - 1)))

        ov_day = (ovulation - last.start_date).days + 1
        if last.end_date is None or cycle_day <= base_period:
            phase = "menstrual"
        elif cycle_day < ov_day - 1:
            phase = "follicular"
        elif cycle_day <= ov_day + 1:
            phase = "ovulation"
        else:
            phase = "luteal"

    # The first period has no preceding cycle; list it too so charts/history are complete.
    cycle_rows = [
        {
            "start_date": c["start_date"].isoformat(),
            "cycle_length": c["cycle_length"],
            "period_length": c["period_length"],
        }
        for c in cycles
    ]

    return Stats(
        today=today,
        total_periods=len(periods),
        total_cycles=len(periods),
        last_period_start=last.start_date if last else None,
        last_period_end=last.end_date if last else None,
        is_period_ongoing=bool(last and last.end_date is None),
        current_cycle_day=cycle_day if cycle_day and cycle_day > 0 else None,
        average_cycle_length=avg_cycle,
        average_cycle_is_estimate=avg_cycle is None,
        average_period_length=avg_period,
        shortest_cycle=min(lengths) if lengths else None,
        longest_cycle=max(lengths) if lengths else None,
        next_period_start=next_start,
        days_until_next_period=days_until,
        estimated_ovulation=ovulation,
        phase=phase,
        predictions=predictions,
        cycle_lengths=cycle_rows,
    )
