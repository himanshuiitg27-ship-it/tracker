from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

MOODS = ("happy", "calm", "energetic", "sensitive", "anxious", "irritable", "sad", "tired")
FLOWS = ("spotting", "light", "medium", "heavy")


def _clean(text: Optional[str]) -> Optional[str]:
    if text is None:
        return None
    text = text.strip()
    return text or None


# ---------------------------------------------------------------- periods
class PeriodBase(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=2000)

    _strip_notes = field_validator("notes")(_clean)

    @model_validator(mode="after")
    def _end_after_start(self):
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("End date cannot be before the start date.")
        return self


class PeriodCreate(PeriodBase):
    pass


class PeriodUpdate(PeriodBase):
    pass


class PeriodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_date: date
    end_date: Optional[date]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    duration_days: Optional[int] = None  # inclusive; None while ongoing
    is_ongoing: bool = False
    cycle_length: Optional[int] = None  # days from the previous start to this start


# ---------------------------------------------------------------- symptoms
class SymptomBase(BaseModel):
    log_date: date
    cramps: int = Field(default=0, ge=0, le=5)
    energy: int = Field(default=3, ge=1, le=5)
    mood: Optional[Literal["happy", "calm", "energetic", "sensitive", "anxious", "irritable", "sad", "tired"]] = None
    flow: Optional[Literal["spotting", "light", "medium", "heavy"]] = None
    notes: Optional[str] = Field(default=None, max_length=2000)

    _strip_notes = field_validator("notes")(_clean)


class SymptomUpsert(SymptomBase):
    pass


class SymptomOut(SymptomBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------- stats
class PredictedPeriod(BaseModel):
    start_date: date
    end_date: date


class Stats(BaseModel):
    today: date
    total_periods: int
    total_cycles: int  # recorded periods (each one starts a cycle)
    last_period_start: Optional[date]
    last_period_end: Optional[date]
    is_period_ongoing: bool
    current_cycle_day: Optional[int]
    average_cycle_length: Optional[int]
    average_cycle_is_estimate: bool  # True if fewer than 2 periods recorded
    average_period_length: Optional[int]
    shortest_cycle: Optional[int]
    longest_cycle: Optional[int]
    next_period_start: Optional[date]
    days_until_next_period: Optional[int]
    estimated_ovulation: Optional[date]
    phase: Optional[str]
    predictions: list[PredictedPeriod]
    cycle_lengths: list[dict]  # [{"start_date", "cycle_length", "period_length"}]
