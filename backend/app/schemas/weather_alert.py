from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WeatherAlertBase(BaseModel):
    id: str
    event: str | None = None
    severity: str | None = None
    area: str | None = None
    description: str | None = None
    wind_mph: float | None = None
    humidity_pct: float | None = None
    onset: str | None = None
    expires: str | None = None
    timestamp: datetime | None = None


class WeatherAlertCreate(WeatherAlertBase):
    pass


class WeatherAlertUpdate(BaseModel):
    event: str | None = None
    severity: str | None = None
    area: str | None = None
    description: str | None = None
    wind_mph: float | None = None
    humidity_pct: float | None = None
    onset: str | None = None
    expires: str | None = None
    timestamp: datetime | None = None


class WeatherAlertResponse(WeatherAlertBase):
    saved_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
