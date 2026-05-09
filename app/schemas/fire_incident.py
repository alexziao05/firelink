from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FireIncidentBase(BaseModel):
    id: str
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    acres: int | None = None
    containment: float | None = None
    status: str | None = None
    timestamp: datetime | None = None


class FireIncidentCreate(FireIncidentBase):
    pass


class FireIncidentUpdate(BaseModel):
    name: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    acres: int | None = None
    containment: float | None = None
    status: str | None = None
    timestamp: datetime | None = None


class FireIncidentResponse(FireIncidentBase):
    saved_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
