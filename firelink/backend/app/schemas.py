"""
Pydantic schemas for request/response validation in EvacLink.
"""
from pydantic import BaseModel
from datetime import datetime
from enum import Enum
from typing import List, Optional


class ReportType(str, Enum):
    """Report types."""
    BLOCKED_ROAD = "blocked_road"
    FIRE_SEEN = "fire_seen"
    HEAVY_SMOKE = "heavy_smoke"
    ASSISTANCE_NEEDED = "assistance_needed"
    POWER_OUTAGE = "power_outage"


class ReportCreate(BaseModel):
    """Schema for creating a new report."""
    report_type: ReportType
    latitude: float
    longitude: float
    note: Optional[str] = None


class ReportRead(BaseModel):
    """Schema for reading a report."""
    id: int
    report_type: ReportType
    latitude: float
    longitude: float
    note: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_resolved: bool

    class Config:
        from_attributes = True


class ShelterRead(BaseModel):
    """Schema for reading shelter information."""
    id: int
    name: str
    latitude: float
    longitude: float
    capacity: Optional[int]
    description: Optional[str]

    class Config:
        from_attributes = True


class RiskCell(BaseModel):
    """Schema for a risk cell in the risk grid."""
    latitude: float
    longitude: float
    risk_score: float  # 0.0 to 1.0


class RouteRequest(BaseModel):
    """Schema for requesting a safe evacuation route."""
    start_latitude: float
    start_longitude: float
    shelter_id: Optional[int] = None  # If None, go to nearest shelter


class RouteResponse(BaseModel):
    """Schema for route response."""
    route_geojson: dict  # GeoJSON LineString
    risk_score: float
    explanation: List[str]
    destination_shelter: ShelterRead
